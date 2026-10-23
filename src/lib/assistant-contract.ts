import { z } from "zod";

export const assistantLanguage = z.enum(["mr", "en"]);
export const chatRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(1200),
    language: assistantLanguage,
    history: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().trim().min(1).max(4000),
          })
          .strict(),
      )
      .max(10)
      .default([]),
  })
  .strict()
  .refine(
    (value) =>
      value.history.reduce((sum, item) => sum + item.content.length, 0) <=
      14000,
    "Conversation is too long. Start a new conversation.",
  );

export const speechRequestSchema = z
  .object({
    text: z.string().trim().min(1).max(4000),
    language: assistantLanguage,
    token: z.string().min(20).max(500),
  })
  .strict();

export type AssistantSource = { id: string; title: string; url: string };
export type AssistantReply = {
  answer: string;
  sources: AssistantSource[];
  speechToken: string;
};
export const MAX_RECORDING_BYTES = 3 * 1024 * 1024;
export const MAX_RECORDING_SECONDS = 30;

// Inspect the container signature rather than trusting the supplied MIME type.
export function recordingFormat(
  bytes: Uint8Array,
): "webm" | "mp4" | "wav" | null {
  if (bytes.length < 44) return null;
  if (
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  )
    return "webm";
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE") return "wav";
  if (ascii(4, 8) === "ftyp") return "mp4";
  return null;
}
