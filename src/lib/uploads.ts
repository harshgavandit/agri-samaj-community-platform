import { HttpError } from "./http";
import { prisma } from "./prisma";

export async function requireOwnedUpload(
  url: string | null | undefined,
  userId: string,
  kind?: "image",
) {
  if (!url) return;
  const id = url.replace("/api/files/", "");
  const file = await prisma.upload.findUnique({ where: { id } });
  if (
    !file ||
    !file.isReady ||
    file.userId !== userId ||
    (kind === "image" && !file.mimeType.startsWith("image/"))
  )
    throw new HttpError(400, "Choose a valid file from your account.");
}

export function detectMime(bytes: Buffer) {
  if (bytes.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (
    bytes.subarray(0, 4).toString() === "RIFF" &&
    bytes.subarray(8, 12).toString() === "WEBP"
  )
    return "image/webp";
  return null;
}
