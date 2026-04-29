// src/ingest.ts — run once to load docs into ChromaDB
// Usage: npm run ingest

import { RAGPipeline } from "./rag.js";

const rag = new RAGPipeline();
await rag.init();
await rag.ingestDocs("docs/");
console.log("Done. Run `npm start` to query.");
