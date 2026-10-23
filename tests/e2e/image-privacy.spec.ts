import { test, expect, request as playwrightRequest } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const database = new URL(process.env.DATABASE_URL || "http://invalid");
if (
  !["localhost", "127.0.0.1"].includes(database.hostname) ||
  !database.searchParams.get("schema")?.startsWith("e2e_")
)
  throw new Error("Image privacy tests require an isolated local e2e schema.");

const db = new PrismaClient();
const baseURL = process.env.E2E_BASE_URL!;

test.beforeEach(async () => {
  await db.rateLimit.deleteMany();
});
test.afterAll(async () => db.$disconnect());

test("published uploads bypass the public image optimizer and become private on withdrawal", async ({
  page,
  request,
}) => {
  test.skip(
    process.env.E2E_BLOB_TEST === "true",
    "This regression uses isolated local upload storage without cloud calls.",
  );
  const admin = await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: { origin: baseURL },
  });
  try {
    const login = await admin.post("/api/auth/login", {
      data: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      },
    });
    expect(login.status(), await login.text()).toBe(200);
    const image = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBQsAAAAASUVORK5CYII=",
      "base64",
    );
    const upload = await admin.post("/api/upload", {
      multipart: {
        file: {
          name: "cover-privacy.png",
          mimeType: "image/png",
          buffer: image,
        },
      },
    });
    expect(upload.status(), await upload.text()).toBe(200);
    const fileUrl = (await upload.json()).url as string;
    const optimizedUrl = `/_next/image?${new URLSearchParams({
      url: fileUrl,
      w: "640",
      q: "75",
    })}`;
    // Private media must never enter the shared optimizer, even with an owner session.
    expect((await request.get(fileUrl)).status()).toBe(403);
    expect((await request.get(optimizedUrl)).status()).toBe(400);
    expect((await admin.get(optimizedUrl)).status()).toBe(400);

    const slug = `cover-privacy-${randomUUID()}`;
    const content = {
      slug,
      kind: "CULTURE",
      titleMr: "समुदाय प्रतिमा गोपनीयता चाचणी",
      titleEn: `Cover privacy ${slug}`,
      summaryMr: "प्रकाशित समुदाय प्रतिमेच्या प्रवेशाची स्थानिक चाचणी.",
      summaryEn: "An isolated check of access to a published community cover.",
      bodyMr:
        "समुदाय प्रतिमा प्रकाशित आणि मागे घेतल्यानंतर प्रवेश तपासण्यासाठी स्थानिक चाचणी.",
      bodyEn:
        "This isolated article checks image access after publication and withdrawal.",
      sources: [
        { label: "Test reference", url: "https://example.org/reference" },
      ],
      period: "EVERGREEN",
      status: "PUBLISHED",
      sourceVerified: true,
      coverImageUrl: fileUrl,
      coverCredit: "Synthetic local test image",
    };
    const published = await admin.post("/api/admin/community", {
      data: content,
    });
    expect(published.status(), await published.text()).toBe(200);
    const entry = (await published.json()).entry;

    const publicImage = await request.get(fileUrl);
    expect(publicImage.status()).toBe(200);
    expect(await publicImage.body()).toEqual(image);
    expect(publicImage.headers()["cache-control"]).toBe("private, no-store");
    // Reject optimization while the image is public, preventing a cached copy
    // from surviving a later archive or source-verification withdrawal.
    expect((await request.get(optimizedUrl)).status()).toBe(400);
    await page.goto(`/culture?q=${slug}`);
    const cardImage = page.locator("img.editorial-image");
    await expect(cardImage).toHaveAttribute("src", fileUrl);
    await expect(cardImage).not.toHaveAttribute("srcset", /.+/);
    await page.goto(`/community/${slug}`);
    const articleImage = page.locator("img.article-image");
    await expect(articleImage).toHaveAttribute("src", fileUrl);
    await expect(articleImage).not.toHaveAttribute("srcset", /.+/);
    await expect
      .poll(() =>
        articleImage.evaluate(
          (element: HTMLImageElement) => element.naturalWidth,
        ),
      )
      .toBeGreaterThan(0);

    const archived = await admin.post("/api/admin/community", {
      data: {
        ...content,
        id: entry.id,
        revision: entry.revision,
        status: "ARCHIVED",
      },
    });
    expect(archived.status(), await archived.text()).toBe(200);
    expect((await request.get(fileUrl)).status()).toBe(403);
    expect((await request.get(optimizedUrl)).status()).toBe(400);
    // The uploader retains access to the private file after publication ends.
    expect((await admin.get(fileUrl)).status()).toBe(200);
  } finally {
    await admin.dispose();
  }
});
