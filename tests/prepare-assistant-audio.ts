import { mkdir, writeFile } from "node:fs/promises";
import { narrate } from "../src/lib/assistant-provider";

async function main() {
  if (process.env.E2E_AI_LIVE !== "true")
    throw new Error(
      "Synthetic speech preparation requires explicit live AI testing.",
    );
  await mkdir("storage/ai", { recursive: true });
  const bytes = await narrate(
    "How can I register my business on the Agri Samaj website?",
    "en",
    new AbortController().signal,
  );
  await writeFile("storage/ai/question.wav", bytes);
  console.log(
    "Prepared a synthetic spoken question for live browser verification.",
  );
}
main().catch(() => {
  console.error(
    "Could not prepare the synthetic audio fixture. Check the configured OpenAI audio model and access.",
  );
  process.exitCode = 1;
});
