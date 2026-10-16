import {
  test,
  expect,
  request as playwrightRequest,
  Page,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const password = `Member-${process.env.E2E_RUN_ID}!`;
const memberEmail = "journey@example.test";
const english = async (page: Page) => {
  await page.addInitScript(() => localStorage.setItem("agri_samaj_lang", "en"));
};
async function login(page: Page, admin = false) {
  await english(page);
  await page.goto("/login");
  await page
    .getByLabel("Email Address")
    .fill(admin ? process.env.ADMIN_EMAIL! : memberEmail);
  await page
    .getByLabel(/^Password/)
    .fill(admin ? process.env.ADMIN_PASSWORD! : password);
  await page.getByRole("button", { name: /Sign In|Login/i }).click();
  await expect(page).toHaveURL(admin ? /\/admin$/ : /\/dashboard$/);
}
test.afterAll(async () => db.$disconnect());

test("member browser journey: register, save and resume a draft, upload, submit, admin review, public search", async ({
  page,
  browser,
}) => {
  if (process.env.E2E_BLOB_TEST === "true") test.setTimeout(180_000);
  await english(page);
  await page.goto("/register");
  await page.getByLabel("Full Name").fill("Browser Test Member");
  await page.getByLabel("Email Address").fill(memberEmail);
  await page.getByLabel(/^Password/).fill(password);
  await page
    .getByRole("button", { name: /Register|Create Account|Sign Up/i })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/register-business");
  await page.locator("[name=ownerName]").fill("Browser Test Member");
  await page.locator("[name=ownerPhone]").fill("9999999999");
  await page.getByRole("button", { name: /Save.*Draft/i }).click();
  await expect(
    page.getByRole("heading", { name: "Draft Saved Successfully!" }),
  ).toBeVisible();
  const draft = await db.businessProfile.findFirstOrThrow({
    where: { user: { email: memberEmail } },
  });
  expect(draft.status).toBe("DRAFT");
  await page.goto("/dashboard");
  await page
    .locator(`a[href="/register-business?id=${draft.id}"]`)
    .first()
    .click();
  await expect(page.locator("[name=ownerName]")).toHaveValue(
    "Browser Test Member",
  );
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.locator("[name=businessName]").fill("Browser Verified Workshop");
  await page
    .locator("[name=productsServices]")
    .fill("End-to-end test workshop services");
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.locator("[name=officeAddress]").fill("Private test street");
  await page.locator("[name=officeCity]").fill("Panvel");
  await page.locator("[name=officePincode]").fill("410206");
  await page.locator("[name=isAddressPublic]").uncheck();
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.locator("[name=employeeCountFemale]").fill("2");
  await page.locator("[name=employeeCountMale]").fill("3");
  await page.getByRole("button", { name: /^Next/ }).click();
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "verification.pdf",
      mimeType: "application/pdf",
      buffer:
        process.env.E2E_BLOB_TEST === "true"
          ? Buffer.concat([
              Buffer.from("%PDF-1.4\n"),
              Buffer.alloc(5 * 1024 * 1024 - 9, 32),
            ])
          : Buffer.from("%PDF-1.4\nE2E test document\n%%EOF"),
    });
  await expect(
    page.getByRole("link", { name: "View Uploaded Document" }),
  ).toBeVisible({
    timeout: process.env.E2E_BLOB_TEST === "true" ? 120_000 : 10_000,
  });
  await page.locator("[name=termsAccepted]").check();
  await page.getByRole("button", { name: /Submit/i }).click();
  await expect(
    page.getByText(/AASP-UDY-\d{4}-[A-F0-9]{16}/).first(),
  ).toBeVisible();
  await expect
    .poll(
      async () =>
        (
          await db.businessProfile.findUniqueOrThrow({
            where: { id: draft.id },
          })
        ).status,
    )
    .toBe("PENDING");
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await login(admin, true);
  await admin.goto("/admin/businesses?status=PENDING");
  await admin.getByRole("button", { name: "Review / Action" }).first().click();
  await admin.getByRole("button", { name: "Approve for Directory" }).click();
  await expect
    .poll(
      async () =>
        (
          await db.businessProfile.findUniqueOrThrow({
            where: { id: draft.id },
          })
        ).status,
    )
    .toBe("APPROVED");
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await english(publicPage);
  await publicPage.goto("/directory");
  await publicPage.getByRole("searchbox").fill("Browser Verified");
  await expect(
    publicPage.getByRole("heading", { name: "Browser Verified Workshop" }),
  ).toBeVisible();
  await publicPage.locator(`a[href="/directory/${draft.id}"]`).click();
  await expect(
    publicPage.getByText(
      "The exact address is private. Contact the business directly.",
    ),
  ).toBeVisible();
  await expect(publicPage.getByText("Private test street")).toHaveCount(0);
  const record = await db.businessProfile.findUniqueOrThrow({
    where: { id: draft.id },
  });
  expect(record.employeeCountTotal).toBe(5);
  const privateResponse = await publicContext.request.get(record.documentUrl!);
  expect(privateResponse.status()).toBe(403);
  expect((await adminContext.request.get(record.documentUrl!)).status()).toBe(
    200,
  );
  expect(
    await db.auditLog.count({ where: { entityId: draft.id } }),
  ).toBeGreaterThanOrEqual(3);
  await adminContext.close();
  await publicContext.close();
});

test("contact form persists an inquiry and admin resolves it through the browser", async ({
  page,
}) => {
  await english(page);
  await page.goto("/contact");
  await page.locator("[name=name]").fill("Contact Journey");
  await page.locator("[name=email]").fill("contact@example.test");
  await page
    .locator("[name=message]")
    .fill("Please provide office information for our workshop.");
  await page.getByRole("button", { name: /Send|Submit/i }).click();
  await expect
    .poll(() =>
      db.contactInquiry.count({ where: { email: "contact@example.test" } }),
    )
    .toBe(1);
  await login(page, true);
  await page.goto("/admin/inquiries");
  await page
    .getByRole("button", { name: /Resolved|Resolve/i })
    .first()
    .click();
  await expect
    .poll(
      async () =>
        (
          await db.contactInquiry.findFirstOrThrow({
            where: { email: "contact@example.test" },
          })
        ).status,
    )
    .toBe("RESOLVED");
});

test("advertisement booking persists the server price and waits for manual payment verification", async ({
  page,
}) => {
  await login(page);
  await page.goto("/advertise/book?package=e2e-package");
  for (const [name, value] of Object.entries({
    advertiserName: "Test Advertiser",
    businessName: "Test Workshop",
    phone: "9999999999",
    email: "ads@example.test",
    address: "Test office address",
    adTextContent: "Test advertisement copy",
    paymentReference: "CLAIMED-REFERENCE",
  }))
    await page.locator(`[name=${name}]`).fill(value);
  await page.getByRole("button", { name: /Submit|Book|Confirm/i }).click();
  await expect(
    page.getByRole("heading", { name: /Ad Booking Received/i }),
  ).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/dashboard");
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    )
    .toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  const booking = await db.advertisementBooking.findFirstOrThrow({
    where: { email: "ads@example.test" },
  });
  expect(booking.paymentStatus).toBe("PENDING");
  expect(booking.amount).toBe(1200);
  await login(page, true);
  await page.goto("/admin/advertisements");
  await page
    .getByRole("button", { name: /Mark Verified/i })
    .first()
    .click();
  await expect
    .poll(
      async () =>
        (
          await db.advertisementBooking.findUniqueOrThrow({
            where: { id: booking.id },
          })
        ).paymentStatus,
    )
    .toBe("VERIFIED");
});

test("admin manages categories, real advertisement rates, and publication links", async ({
  page,
}) => {
  await login(page, true);
  await page.goto("/admin/categories");
  await page
    .getByRole("button", { name: /Add.*Category|New Category/i })
    .click();
  await page.getByLabel(/Slug/).fill("browser-category");
  await page.getByLabel("Name (Marathi)").fill("चाचणी श्रेणी");
  await page.getByLabel("Name (English)").fill("Browser Category");
  await page.getByRole("button", { name: /Save|Add Category/i }).click();
  await expect
    .poll(() =>
      db.businessCategory.count({ where: { slug: "browser-category" } }),
    )
    .toBe(1);
  await page.goto("/admin/advertisements");
  await page.getByRole("button", { name: "Add record" }).click();
  await page.getByLabel("Package code").fill("BROWSER_RATE");
  await page.getByLabel("Name (Marathi)").fill("चाचणी दर");
  await page.getByLabel("Name (English)").fill("Browser rate");
  await page.getByLabel("Price (INR)").fill("2500");
  await page.getByLabel("Dimensions").fill("A4");
  await page.getByLabel("Available for booking").check();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Record saved.")).toBeVisible();
  await page.goto("/admin/publications");
  await page.getByRole("button", { name: "Add record" }).click();
  await page.getByLabel("Title (Marathi)").fill("प्रकाशन चाचणी");
  await page.getByLabel("Title (English)").fill("Browser publication");
  await page.getByLabel("Approved public PDF URL").fill("/Agri_SAMAJ_PDF.pdf");
  await page.getByLabel("Publish publicly").check();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Record saved.")).toBeVisible();
  await page.goto("/publications");
  await expect(
    page.getByRole("heading", { name: "Browser publication" }),
  ).toBeVisible();
  expect((await page.request.get("/Agri_SAMAJ_PDF.pdf")).status()).toBe(200);
});

test("authorization, malformed inputs, CSRF, uploads and payment tampering fail safely", async ({
  request,
}) => {
  const json = { "Content-Type": "application/json" };
  expect(
    (await request.post("/api/businesses/register", { data: {} })).status(),
  ).toBe(401);
  for (const route of [
    "ads",
    "businesses",
    "categories",
    "inquiries",
    "announcements",
    "census",
    "stats",
    "packages",
    "publications",
  ])
    expect((await request.get("/api/admin/" + route)).status()).toBe(401);
  expect(
    (
      await request.post("/api/contact", {
        headers: { ...json, Origin: "https://attacker.example" },
        data: { name: "X", email: "x@example.test", message: "x" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/auth/register", {
        data: { name: "X", email: "invalid", password: "short" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (await request.post("/api/contact", { headers: json, data: "{" })).status(),
  ).toBe(400);
  expect((await request.get("/api/businesses?page=nope")).status()).toBe(400);
  expect(
    (
      await request.post("/api/upload", {
        multipart: {
          file: {
            name: "bad.png",
            mimeType: "image/png",
            buffer: Buffer.from("<html>not a PNG</html>"),
          },
        },
      })
    ).status(),
  ).toBe(401);
  const attacker = await playwrightRequest.newContext({
    baseURL: process.env.E2E_BASE_URL,
  });
  expect(
    (
      await attacker.post("/api/auth/register", {
        data: { name: "Other Member", email: "other@example.test", password },
      })
    ).status(),
  ).toBe(200);
  const profile = await db.businessProfile.findFirstOrThrow({
    where: { user: { email: memberEmail } },
  });
  expect(
    (
      await attacker.post("/api/businesses/register", {
        data: { id: profile.id, categoryId: profile.categoryId, isDraft: true },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await attacker.post("/api/upload", {
        multipart: {
          file: {
            name: "bad.png",
            mimeType: "image/png",
            buffer: Buffer.from("<html>not a PNG</html>"),
          },
        },
      })
    ).status(),
  ).toBe(400);
  expect((await attacker.get("/api/admin/stats")).status()).toBe(403);
  expect((await attacker.get(profile.documentUrl!)).status()).toBe(403);
  const listed = await (
    await request.get("/api/businesses?q=Browser%20Verified")
  ).json();
  const publicRecord = listed.businesses[0];
  for (const key of [
    "documentUrl",
    "adminNotes",
    "userId",
    "ownerEmail",
    "ownerPhone",
    "officeAddress",
  ])
    expect(publicRecord).not.toHaveProperty(key);
  await db.user.update({
    where: { email: "other@example.test" },
    data: { isActive: false },
  });
  expect((await attacker.get("/api/auth/me")).ok()).toBeTruthy();
  expect(
    (await (await attacker.get("/api/auth/me")).json()).authenticated,
  ).toBe(false);
  await attacker.dispose();
});

test("census validates aggregates, persists records, and rejects invalid counts", async ({
  page,
}) => {
  await login(page, true);
  await page.goto("/admin/census");
  await page.getByRole("button", { name: "Add Enumerator Entry" }).click();
  // Fill according to visible field labels, preserving explicit questionnaire accounting.
  for (const [label, value] of [
    ["Enumerator No.", "E2E-001"],
    ["Surveyor Name", "Test Surveyor"],
    ["Division Name", "Test Division"],
    ["Taluka", "Panvel"],
    ["District", "Raigad"],
    ["Total Houses", "100"],
    ["Agri Houses", "80"],
    ["Questionnaires Used", "80"],
    ["Blank Questionnaires", "20"],
  ]) {
    const field = page.getByLabel(label, { exact: true });
    if (await field.count()) await field.fill(value);
  }
  // Census pincode is mandatory and must be exposed in the form.
  const pin = page.getByLabel(/Pincode|PIN Code/i);
  if (await pin.count()) await pin.fill("410206");
  await page.getByLabel("Questionnaire start").fill("1");
  await page.getByLabel("Questionnaire end").fill("100");
  await page.getByRole("button", { name: /Save|Submit/i }).click();
  await expect
    .poll(() => db.censusTracker.count({ where: { enumeratorNo: "E2E-001" } }))
    .toBe(1);
  expect(
    (
      await page.request.post("/api/admin/census", {
        data: {
          enumeratorNo: "E2E-002",
          surveyorName: "S",
          divisionName: "D",
          taluka: "T",
          district: "D",
          pincode: "410206",
          totalHouses: 1,
          agriHouses: 2,
        },
      })
    ).status(),
  ).toBe(400);
  await page.reload();
  await expect(page.getByText("E2E-001")).toBeVisible();
});

test("all public pages and protected gates are responsive and free of serious accessibility issues", async ({
  page,
}) => {
  test.setTimeout(240000);
  await english(page);
  const errors: string[] = [];
  const accessibilityFindings: unknown[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const width of [375, 768, 1280, 1536]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/directory",
      "/advertise",
      "/publications",
      "/initiatives",
      "/contact",
      "/privacy",
      "/login",
      "/register",
      "/register-business",
      "/advertise/book",
      "/dashboard",
      "/admin",
    ]) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} HTTP`).toBe(200);
      if (width === 1536) {
        const report = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        accessibilityFindings.push(
          ...report.violations
            .filter((v) => v.impact === "serious" || v.impact === "critical")
            .map((v) => ({
              route,
              id: v.id,
              nodes: v.nodes.map((n) => ({
                target: n.target,
                summary: n.failureSummary,
              })),
            })),
        );
      }
      await expect(page.locator("main")).toBeVisible();
      await expect
        .poll(
          () =>
            page.evaluate(
              () =>
                document.documentElement.scrollWidth <= window.innerWidth + 1,
            ),
          { message: `No overflow at ${width}: ${route}` },
        )
        .toBe(true);
    }
  }
  expect(accessibilityFindings).toEqual([]);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle menu" }).click();
  await expect(page.locator("#mobile-navigation")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-navigation")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1536, height: 1000 });
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("announcements publish, edit, and unpublish through the browser", async ({
  page,
}) => {
  await login(page, true);
  await page.goto("/admin/announcements");
  await page.getByRole("button", { name: "Add Announcement / Event" }).click();
  await page.getByLabel("Title (Marathi)").fill("घोषणा चाचणी");
  await page.getByLabel("Title (English)").fill("Browser announcement");
  await page
    .getByLabel("Content (Marathi)")
    .fill("ही स्वयंचलित चाचणीची घोषणा आहे.");
  await page
    .getByLabel("Content (English)")
    .fill("An announcement in the disposable test database.");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect
    .poll(() =>
      db.announcement.count({
        where: { titleEn: "Browser announcement", isPublished: true },
      }),
    )
    .toBe(1);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Publish publicly").uncheck();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect
    .poll(() =>
      db.announcement.count({
        where: { titleEn: "Browser announcement", isPublished: false },
      }),
    )
    .toBe(1);
  const publicRecords = await (
    await page.request.get("/api/announcements")
  ).json();
  expect(publicRecords.announcements).toEqual([]);
});

test("failed login stays visible, logout clears the session, and enumerators reach their restricted workspace", async ({
  page,
}) => {
  await english(page);
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(memberEmail);
  await page.getByLabel(/^Password/).fill("IncorrectPassword!");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Invalid credentials" }),
  ).toBeVisible();
  await login(page);
  await page.getByRole("button", { name: "Toggle menu" }).click();
  await page.getByRole("button", { name: /Logout|Sign Out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(
    (await (await page.request.get("/api/auth/me")).json()).authenticated,
  ).toBe(false);
  await db.user.update({
    where: { email: "other@example.test" },
    data: { isActive: true, role: "ENUMERATOR" },
  });
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("other@example.test");
  await page.getByLabel(/^Password/).fill(password);
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/census$/);
  await expect(
    page.getByRole("button", { name: "Add Enumerator Entry" }),
  ).toBeVisible();
  expect((await page.request.get("/api/admin/stats")).status()).toBe(403);
});

test("persistent admission rejects repeated contact requests and security headers are present", async ({
  request,
}) => {
  const response = await request.get("/");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["content-security-policy"]).toContain(
    "object-src 'none'",
  );
  let status = 0;
  for (let i = 0; i < 11; i++) {
    status = (await request.post("/api/contact", { data: {} })).status();
    if (status === 429) break;
  }
  expect(status).toBe(429);
});
