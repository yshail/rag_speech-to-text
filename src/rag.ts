// src/rag.ts — RAG pipeline (no LangChain, raw primitives)
//
// Steps:
//   1. Chunk text manually
//   2. Embed with @xenova/transformers (local)
//   3. Store/query with ChromaDB
//   4. Generate answer with Ollama

import { ChromaClient, Collection } from "chromadb";
import { pipeline, FeatureExtractionPipeline } from "@xenova/transformers";
import ollama from "ollama";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const COLLECTION_NAME = "rag_docs";
const CHUNK_SIZE = 400;       // characters per chunk
const CHUNK_OVERLAP = 50;
const TOP_K = 4;
const OLLAMA_MODEL = "gemma4"; // change to any model you have pulled

// ── Helpers ──────────────────────────────────────────────────────────────────

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = start + CHUNK_SIZE;
    chunks.push(text.slice(start, end).trim());
    start = end - CHUNK_OVERLAP;
  }
  return chunks.filter((c) => c.length > 20); // drop tiny trailing chunks
}

// ── RAG class ─────────────────────────────────────────────────────────────────

export class RAGPipeline {
  private client: ChromaClient;
  private collection!: Collection;
  private embedder!: FeatureExtractionPipeline;

  constructor() {
    this.client = new ChromaClient(); // default: localhost:8000
  }

  async init(): Promise<void> {
    console.log("⏳ Loading embedding model...");
    this.embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2" // ~25MB, downloads once
    );

    this.collection = await this.client.getOrCreateCollection({
      name: COLLECTION_NAME,
    });

    console.log("✅ RAG pipeline ready.\n");
  }

  // Embed a single string → number[]
  private async embed(text: string): Promise<number[]> {
    const output = await this.embedder(text, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(output.data as Float32Array);
  }

  // ── Ingestion ───────────────────────────────────────────────────────────────

  async ingestDocs(docsDir: string): Promise<void> {
    const files = readdirSync(docsDir).filter((f) => f.endsWith(".txt"));

    if (files.length === 0) {
      console.warn(`⚠️  No .txt files found in '${docsDir}'. Add docs to query.\n`);
      return;
    }

    for (const file of files) {
      const text = readFileSync(join(docsDir, file), "utf-8");
      const chunks = chunkText(text);

      const ids = chunks.map((_, i) => `${file}_${i}`);
      const embeddings = await Promise.all(chunks.map((c) => this.embed(c)));
      const metadatas = chunks.map(() => ({ source: file }));

      await this.collection.upsert({ ids, embeddings, documents: chunks, metadatas });
    }

    console.log(`✅ Ingested ${files.length} file(s).\n`);
  }

  // ── Query ───────────────────────────────────────────────────────────────────

  async query(question: string): Promise<string> {
    const count = await this.collection.count();
    if (count === 0) {
      return "No documents ingested yet. Run: npm run ingest";
    }

    const queryEmbedding = await this.embed(question);

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: Math.min(TOP_K, count),
    });

    const docs = results.documents?.[0] ?? [];
    if (docs.length === 0) return "No relevant context found.";

    const context = docs.join("\n\n---\n\n");

    const prompt =
      `Use the context below to answer the question.\n\n` +
      `Context:\n${context}\n\n` +
      `Question: ${question}\n\n` +
      `Answer concisely based only on the context:`;

    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages: [{ role: "user", content: prompt }],
    });

    return response.message.content;
  }
}
