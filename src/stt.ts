// src/stt.ts — Speech-to-Text using nodejs-whisper (local, no API key)
// nodejs-whisper wraps the original OpenAI Whisper C++ port (whisper.cpp)
//
// First run will auto-download the model (~150MB for "base")

import { nodewhisper } from "nodejs-whisper";

export async function transcribeAudio(audioPath: string): Promise<string> {
  console.log("🎙️  Transcribing audio...");

  const result = await nodewhisper(audioPath, {
    modelName: "base.en",       // tiny.en | base.en | small.en | medium.en
    autoDownloadModelName: "base.en",
    whisperOptions: {
      outputInText: true,
    },
  });

  // result is a string of transcribed text
  return result.trim();
}
