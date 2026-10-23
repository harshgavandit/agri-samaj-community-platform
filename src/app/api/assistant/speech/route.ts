import { assistantAdmission } from "@/lib/assistant-admission";
import { speechRequestSchema } from "@/lib/assistant-contract";
import { narrate, verifySpeech } from "@/lib/assistant-provider";
import { apiError, readJson } from "@/lib/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    await assistantAdmission(request, "speech");
    const { text, language, token } = await readJson(
      request,
      speechRequestSchema,
    );
    verifySpeech(text, language, token);
    const bytes = await narrate(text, language, request.signal);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
