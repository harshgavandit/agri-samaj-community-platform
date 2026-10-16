"use client";
import { put } from "@vercel/blob/client";
import { apiFetch } from "./client-api";

export async function uploadFile(file: File): Promise<string> {
  if (!file.size || file.size > 5 * 1024 * 1024)
    throw new Error("Choose a non-empty file up to 5 MB.");
  const config = await (await apiFetch("/api/upload")).json();
  if (config.direct) {
    const intent = await (
      await apiFetch("/api/upload/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      })
    ).json();
    await put(intent.pathname, file, {
      access: "private",
      token: intent.clientToken,
      contentType: file.type,
    });
    const result = await (
      await apiFetch(`/api/upload/direct/${intent.id}`, {
        method: "POST",
      })
    ).json();
    return result.url;
  }
  const body = new FormData();
  body.append("file", file);
  const result = await (
    await apiFetch("/api/upload", { method: "POST", body })
  ).json();
  return result.url;
}
