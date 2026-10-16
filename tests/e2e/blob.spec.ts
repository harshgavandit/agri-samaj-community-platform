import { test, expect, request as playwrightRequest } from "@playwright/test";
import { put } from "@vercel/blob/client";
import { get, del } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";

test("real private Blob uploads reject incomplete, forged, cross-user, and overwritten files", async ({
  request,
}) => {
  const db = new PrismaClient();
  const uploaded: string[] = [];
  const outsider = await playwrightRequest.newContext({
    baseURL: process.env.E2E_BASE_URL,
  });
  try {
    expect(
      (
        await request.post("/api/auth/login", {
          data: {
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
          },
        })
      ).status(),
    ).toBe(200);
    const body = Buffer.from("%PDF-1.4\nPrivate isolated test file\n%%EOF");
    const intentResponse = await request.post("/api/upload/direct", {
      data: {
        name: "private-test.pdf",
        mimeType: "application/pdf",
        size: body.length,
      },
    });
    expect(intentResponse.status()).toBe(200);
    const intent = await intentResponse.json();
    const fileUrl = `/api/files/${intent.id}`;
    expect((await request.get(fileUrl)).status()).toBe(404);
    await put(intent.pathname, body, {
      access: "private",
      token: intent.clientToken,
      contentType: "application/pdf",
    });
    uploaded.push(intent.pathname);
    const privateBlob = await get(intent.pathname, {
      access: "private",
      useCache: false,
    });
    expect(privateBlob?.statusCode).toBe(200);
    if (privateBlob?.statusCode !== 200)
      throw new Error("Private object unavailable");
    await privateBlob.stream.cancel();
    expect((await outsider.get(privateBlob.blob.url)).ok()).toBeFalsy();
    expect(
      (await outsider.post(`/api/upload/direct/${intent.id}`)).status(),
    ).toBe(401);
    expect(
      (await request.post(`/api/upload/direct/${intent.id}`)).status(),
    ).toBe(200);
    expect(await (await request.get(fileUrl)).body()).toEqual(body);
    expect((await outsider.get(fileUrl)).status()).toBe(403);
    await expect(
      put(intent.pathname, body, {
        access: "private",
        token: intent.clientToken,
        contentType: "application/pdf",
      }),
    ).rejects.toThrow();
    const forgedBytes = Buffer.from("<html>invalid image</html>");
    const forged = await (
      await request.post("/api/upload/direct", {
        data: {
          name: "forged.png",
          mimeType: "image/png",
          size: forgedBytes.length,
        },
      })
    ).json();
    await put(forged.pathname, forgedBytes, {
      access: "private",
      token: forged.clientToken,
      contentType: "image/png",
    });
    expect(
      (await request.post(`/api/upload/direct/${forged.id}`)).status(),
    ).toBe(400);
    expect((await request.get(`/api/files/${forged.id}`)).status()).toBe(404);
    expect(await db.upload.findUnique({ where: { id: forged.id } })).toBeNull();
    expect(
      (
        await request.post("/api/upload/direct", {
          data: {
            name: "oversize.pdf",
            mimeType: "application/pdf",
            size: 5 * 1024 * 1024 + 1,
          },
        })
      ).status(),
    ).toBe(400);
    const stale = await (
      await request.post("/api/upload/direct", {
        data: {
          name: "expired.pdf",
          mimeType: "application/pdf",
          size: body.length,
        },
      })
    ).json();
    await db.upload.update({
      where: { id: stale.id },
      data: { createdAt: new Date(Date.now() - 11 * 60_000) },
    });
    expect(
      (await request.post(`/api/upload/direct/${stale.id}`)).status(),
    ).toBe(410);
  } finally {
    // These objects were created only by this test in its isolated local schema.
    for (const pathname of uploaded) await del(pathname);
    await outsider.dispose();
    await db.$disconnect();
  }
});
