import { NextResponse } from "next/server";
import { assistantAdmission } from "@/lib/assistant-admission";
import {
  assistantLanguage,
  MAX_RECORDING_BYTES,
} from "@/lib/assistant-contract";
import { assistantConfig, openaiRequest } from "@/lib/assistant-provider";
import { validateVoiceRecording } from "@/lib/assistant-recording";
import { apiError, HttpError, readBytes } from "@/lib/http";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    await assistantAdmission(request, "transcribe");
    const language = assistantLanguage.parse(
      new URL(request.url).searchParams.get("language"),
    );
    if (request.headers.get("content-type")?.split(";")[0] !== "audio/wav")
      throw new HttpError(415, "Use a WAV voice recording.");
    const bytes = await readBytes(request, MAX_RECORDING_BYTES);
    validateVoiceRecording(bytes);
    const config = assistantConfig();
    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array(bytes)], { type: "audio/wav" }),
      "question.wav",
    );
    form.append("model", config.transcriptionModel);
    if (config.transcriptionModel === "gpt-transcribe")
      form.append("languages[]", language);
    else form.append("language", language);
    form.append(
      "prompt",
      "Agri Samaj community website. Transcribe only spoken words; do not add words to silence.",
    );
    const response = await openaiRequest(
      "audio/transcriptions",
      form,
      request.signal,
      false,
    );
    const data = await response.json();
    const text = typeof data.text === "string" ? data.text.trim() : "";
    if (!text || text.length > 1200)
      throw new HttpError(
        422,
        "No clear, short question was detected. Please record again or type your question.",
      );
    return NextResponse.json({ text });
  } catch (error) {
    return apiError(error);
  }
}
