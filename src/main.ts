// src/main.ts — CLI: transcribe audio → query RAG
// Usage: npm start

import * as readline from "readline";
import { transcribeAudio } from "./stt.js";
import { RAGPipeline } from "./rag.js";

const rag = new RAGPipeline();
await rag.init();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

console.log("=== STT + RAG ===");
console.log("[1] Transcribe audio file and query");
console.log("[2] Type query manually");
console.log("[q] Quit\n");

while (true) {
  const choice = (await ask("Choose (1/2/q): ")).trim();

  if (choice === "q") { rl.close(); break; }

  if (choice === "1") {
    const audioPath = (await ask("Audio file path: ")).trim();
    const transcript = await transcribeAudio(audioPath);
    console.log(`\n📝 Transcript: ${transcript}\n`);
    const answer = await rag.query(transcript);
    console.log(`🤖 Answer:\n${answer}\n`);
  }

  if (choice === "2") {
    const query = (await ask("Query: ")).trim();
    const answer = await rag.query(query);
    console.log(`\n🤖 Answer:\n${answer}\n`);
  }
}
