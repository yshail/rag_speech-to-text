# STT + RAG (TypeScript, fully local, no API keys)

```
audio → nodejs-whisper → transcript → ChromaDB retrieval → Ollama LLM → answer
```

**No LangChain. Every step is explicit.**

---

## Setup

```bash
# 1. Install Ollama → https://ollama.com
ollama pull llama3

# 2. Start ChromaDB (Docker)
docker run -p 8000:8000 chromadb/chroma

# 3. Install dependencies
npm install

# 4. Add your .txt docs
cp your_notes.txt docs/

# 5. Ingest docs (run once)
npm run ingest

# 6. Run
npm start
```

---

## Project Structure

```
src/
├── main.ts      # CLI — ties STT + RAG together
├── stt.ts       # nodejs-whisper transcription
├── rag.ts       # chunk → embed → store → retrieve → generate
└── ingest.ts    # one-time doc ingestion script
docs/            # put your .txt knowledge base files here
audio_input/     # put your .wav audio files here
```

---

## How RAG works (what to say in interview)

1. **Ingest**: Split docs into ~400 char chunks → embed each with `all-MiniLM-L6-v2` → store vectors in ChromaDB
2. **Query**: Embed the question → find top-4 most similar chunks (cosine similarity) → pass chunks + question to LLM
3. **Generate**: LLM answers using only the retrieved context (grounded, no hallucination)

## Key config (in `rag.ts`)

| Variable | Default | What it does |
|---|---|---|
| `CHUNK_SIZE` | `400` | Characters per chunk |
| `TOP_K` | `4` | Chunks retrieved per query |
| `OLLAMA_MODEL` | `"llama3"` | Local LLM model |

## Swap LLM to OpenAI

```ts
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const res = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: prompt }],
});
return res.choices[0].message.content!;
```
