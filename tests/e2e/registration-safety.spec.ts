import { test, expect, type Page, type Route } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const connection = new URL(process.env.DATABASE_URL || "http://invalid");
if (
  !["localhost", "127.0.0.1"].includes(connection.hostname) ||
  !connection.searchParams.get("schema")?.startsWith("e2e_")
)
  throw new Error(
    "Registration safety tests require an isolated local schema.",
  );
const db = new PrismaClient();

test.beforeEach(async ({ page }) => {
  await db.rateLimit.deleteMany();
  await page.addInitScript(() => localStorage.setItem("agri_samaj_lang", "en"));
});
test.afterAll(async () => db.$disconnect());

async function member(page: Page) {
  const response = await page.request.post("/api/auth/register", {
    data: {
      name: "Registration Safety Member",
      email: `safety-${randomUUID()}@example.test`,
      password: `Safety-${randomUUID()}!`,
    },
  });
  expect(response.ok()).toBe(true);
}

test("final submission waits for pending verification uploads", async ({
  page,
}) => {
  await member(page);
  // The upload is deliberately held at the HTTP boundary to exercise a slow
  // upload. This fixture checks UI admission, not cloud storage integration.
  let releaseUpload!: () => void;
  let uploadStarted = false;
  const pending = new Promise<void>((resolve) => (releaseUpload = resolve));
  await page.route("**/api/upload", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { direct: false } });
      return;
    }
    uploadStarted = true;
    await pending;
    await route.fulfill({ json: { url: "/api/files/upload-safety-fixture" } });
  });
  let submissions = 0;
  await page.route("**/api/businesses/register", async (route) => {
    submissions++;
    await route.fulfill({
      status: 500,
      json: { error: "Unexpected submission" },
    });
  });
  await page.goto("/register-business");
  await page.locator("[name=ownerName]").fill("Safety Member");
  await page.locator("[name=ownerPhone]").fill("9999999999");
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.locator("[name=businessName]").fill("Upload Safety Workshop");
  await page.locator("[name=productsServices]").fill("Workshop services");
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.locator("[name=officeAddress]").fill("Test workshop street");
  await page.locator("[name=officeCity]").fill("Panvel");
  await page.locator("[name=officePincode]").fill("410206");
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.locator("[name=termsAccepted]").check();
  const submit = page.getByRole("button", {
    name: "Submit Application",
    exact: true,
  });
  await expect(submit).toBeEnabled();
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "slow-verification.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\nTest fixture\n%%EOF"),
    });
  await expect.poll(() => uploadStarted).toBe(true);
  await expect(submit).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /Save.*Draft/i }),
  ).toBeDisabled();
  expect(submissions).toBe(0);
  releaseUpload();
  await expect(
    page.getByRole("link", { name: "View Uploaded Document" }),
  ).toBeVisible();
  await expect(submit).toBeEnabled();
  expect(submissions).toBe(0);
});

test("editing waits for the profile and ignores a stale edit response", async ({
  page,
}) => {
  await member(page);
  let releaseFirst!: () => void;
  let firstStarted = false;
  let firstFinished = false;
  const pending = new Promise<void>((resolve) => (releaseFirst = resolve));
  await page.route("**/api/businesses/safety-first", async (route) => {
    firstStarted = true;
    await pending;
    await route
      .fulfill({
        json: { business: { id: "safety-first", ownerName: "Stale owner" } },
      })
      .catch(() => undefined);
    firstFinished = true;
  });
  await page.route("**/api/businesses/safety-second", async (route) => {
    await route.fulfill({
      json: { business: { id: "safety-second", ownerName: "Current owner" } },
    });
  });
  await page.goto("/register-business?id=safety-first");
  await expect.poll(() => firstStarted).toBe(true);
  await expect(page.getByText("Loading your application…")).toBeVisible();
  await expect(page.locator("[name=ownerName]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Save.*Draft/i })).toHaveCount(
    0,
  );
  await page.evaluate(() => {
    window.history.pushState(null, "", "/register-business?id=safety-second");
  });
  await expect(page.locator("[name=ownerName]")).toHaveValue("Current owner");
  await page.locator("[name=ownerName]").fill("An edit made after loading");
  releaseFirst();
  await expect.poll(() => firstFinished).toBe(true);
  await expect(page.locator("[name=ownerName]")).toHaveValue(
    "An edit made after loading",
  );
});

test("failed profile loading keeps editing blocked and supports retry", async ({
  page,
}) => {
  await member(page);
  let attempts = 0;
  await page.route("**/api/businesses/safety-retry", async (route: Route) => {
    attempts++;
    await route.fulfill(
      attempts === 1
        ? { status: 503, json: { error: "Temporary profile failure" } }
        : {
            json: {
              business: { id: "safety-retry", ownerName: "Loaded on retry" },
            },
          },
    );
  });
  await page.goto("/register-business?id=safety-retry");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Temporary profile failure",
  );
  await expect(page.locator("[name=ownerName]")).toHaveCount(0);
  await page.getByRole("button", { name: "Retry loading application" }).click();
  await expect(page.locator("[name=ownerName]")).toHaveValue("Loaded on retry");
  expect(attempts).toBe(2);
});

test("payment verification preserves editorial status until explicit approval", async ({
  page,
}) => {
  const response = await page.request.post("/api/auth/login", {
    data: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
  });
  expect(response.ok()).toBe(true);
  const created = [];
  for (const status of ["PENDING", "REJECTED"]) {
    const booking = await db.advertisementBooking.create({
      data: {
        bookingRef: `PAYMENT-SAFETY-${randomUUID()}`,
        packageId: "e2e-package",
        advertiserName: "Payment Safety Advertiser",
        businessName: "Payment Safety Workshop",
        contactPerson: "Test Member",
        phone: "9999999999",
        email: "payment-safety@example.test",
        address: "Test address",
        adTextContent: "Test-only advertisement awaiting editorial review",
        amount: 1200,
        status,
      },
    });
    created.push(booking);
  }
  await page.goto("/admin/advertisements");
  for (const booking of created) {
    const row = page.getByRole("row").filter({ hasText: booking.bookingRef });
    await row
      .getByRole("button", { name: "Mark Verified", exact: true })
      .click();
    await expect
      .poll(async () => {
        const stored = await db.advertisementBooking.findUniqueOrThrow({
          where: { id: booking.id },
        });
        return { paymentStatus: stored.paymentStatus, status: stored.status };
      })
      .toEqual({ paymentStatus: "VERIFIED", status: booking.status });
    await expect(
      row.getByRole("button", { name: "Approve", exact: true }),
    ).toBeEnabled();
  }
  const pending = created[0];
  await page
    .getByRole("row")
    .filter({ hasText: pending.bookingRef })
    .getByRole("button", { name: "Approve", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (
          await db.advertisementBooking.findUniqueOrThrow({
            where: { id: pending.id },
          })
        ).status,
    )
    .toBe("APPROVED");
});
