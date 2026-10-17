import {
  test,
  expect,
  request as playwrightRequest,
  Page,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const testDatabase = new URL(process.env.DATABASE_URL || "http://invalid");
if (
  !["localhost", "127.0.0.1"].includes(testDatabase.hostname) ||
  !testDatabase.searchParams.get("schema")?.startsWith("e2e_")
)
  throw new Error("Browser fixtures require an isolated local e2e schema.");
test.beforeEach(async () => {
  // Admission remains enabled within each journey; independent journeys must not
  // exhaust each other's login bucket. This database is test-only, checked above.
  await db.rateLimit.deleteMany();
});
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
      "This listing was approved by the platform administrator.",
      { exact: true },
    ),
  ).toBeVisible();
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
  const errors: string[] = [];
  const accessibilityFindings: unknown[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  for (const language of ["en", "mr"]) {
    await page.evaluate(
      (value) => localStorage.setItem("agri_samaj_lang", value),
      language,
    );
    for (const width of [375, 768, 1280, 1536]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        "/",
        "/about",
        "/culture",
        "/resources",
        "/news",
        "/community/aagri-language-heritage",
        "/community/coastal-livelihoods-historical-record",
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
        "/admin/community",
      ]) {
        const response = await page.goto(route);
        expect(response?.status(), `${route} HTTP`).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", language);
        await expect(page.locator(".loading-card")).toHaveCount(0);
        await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
        if (width === 375 || width === 1536) {
          const report = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze();
          accessibilityFindings.push(
            ...report.violations
              .filter((v) => v.impact === "serious" || v.impact === "critical")
              .map((v) => ({
                route,
                language,
                id: v.id,
                nodes: v.nodes.map((n) => ({
                  target: n.target,
                  summary: n.failureSummary,
                })),
              })),
          );
        }
        await expect(page.locator("main")).toBeVisible();
        const overflow = await page.evaluate(() =>
          Array.from(document.querySelectorAll("body *"))
            .filter((element) => {
              const box = element.getBoundingClientRect();
              return (
                box.width > 0 &&
                (box.right > window.innerWidth + 1 || box.left < -1)
              );
            })
            .slice(0, 12)
            .map((element) => ({
              tag: element.tagName,
              className: element.className?.toString(),
              right: element.getBoundingClientRect().right,
            })),
        );
        if (
          await page.evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth + 1,
          )
        )
          console.log(
            "Overflow diagnostics",
            route,
            width,
            JSON.stringify(overflow),
          );
        await expect
          .poll(
            () =>
              page.evaluate(
                () =>
                  document.documentElement.scrollWidth <= window.innerWidth + 1,
              ),
            { message: `No overflow at ${width}: ${route} (${language})` },
          )
          .toBe(true);
      }
    }
  }
  expect(accessibilityFindings).toEqual([]);
  await page.evaluate(() => localStorage.setItem("agri_samaj_lang", "en"));
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

test("content studio saves private drafts, verifies sources, publishes credited media, and archives safely", async ({
  page,
  browser,
}) => {
  await login(page, true);
  await page.goto("/admin/community");
  await page.getByRole("button", { name: "New entry", exact: true }).click();
  await page.getByLabel("URL slug").fill("e2e-community-guide");
  await page
    .getByLabel("Title (Marathi)", { exact: true })
    .fill("समुदाय चाचणी मार्गदर्शक");
  await page
    .getByLabel("Title (English)", { exact: true })
    .fill("Community test guide");
  await page
    .getByLabel("Summary (Marathi)", { exact: true })
    .fill("ही केवळ वेगळ्या चाचणी डेटाबेसमधील प्रकाशन प्रक्रियेची चाचणी आहे.");
  await page
    .getByLabel("Summary (English)", { exact: true })
    .fill("An isolated test of the moderated community publishing workflow.");
  await page
    .getByLabel("Body (Marathi)", { exact: true })
    .fill(
      "ही स्वयंचलित चाचणीची माहिती आहे. ती प्रत्यक्ष समुदायाची घटना किंवा यशोगाथा नाही.",
    );
  await page
    .getByLabel("Body (English)", { exact: true })
    .fill(
      'An isolated publishing test. Literal markup must remain text: <img src="x" onerror="alert(1)">.',
    );
  await page
    .getByLabel("Sources: one title | HTTPS URL per line", { exact: true })
    .fill("Government reference | https://ncs.gov.in/");
  await page
    .getByLabel("Internal editorial notes (private)", { exact: true })
    .fill("INTERNAL_DO_NOT_PUBLISH");
  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByLabel("Cover image", { exact: true }).setInputFiles({
    name: "owned-test.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBQsAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.locator("p.break-all")).toHaveText(/^\/api\/files\//);
  const imageUrl = await page.locator("p.break-all").innerText();
  await page
    .getByLabel("Image credit & publication permission", { exact: true })
    .fill("Synthetic test image owned by the test operator.");
  await page.getByRole("button", { name: "Save entry", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Entry saved");
  let saved = await db.communityContent.findUniqueOrThrow({
    where: { slug: "e2e-community-guide" },
  });
  expect(saved.status).toBe("DRAFT");
  const anonymous = await playwrightRequest.newContext({
    baseURL: process.env.E2E_BASE_URL,
  });
  expect((await anonymous.get(imageUrl)).status()).toBe(403);
  expect((await anonymous.get("/community/e2e-community-guide")).status()).toBe(
    404,
  );
  expect(
    JSON.stringify(await (await anonymous.get("/api/community")).json()),
  ).not.toContain("INTERNAL_DO_NOT_PUBLISH");
  await page.getByLabel("Publication status").selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Save entry", exact: true }).click();
  await expect(page.locator(".request-notice[role=alert]")).toContainText(
    "Verify at least one supporting source",
  );
  await page
    .getByLabel(
      "I checked the sources, the period of the information and the required publication permissions.",
      { exact: true },
    )
    .check();
  const publishRequest = page.waitForRequest(
    (request) =>
      request.url().endsWith("/api/admin/community") &&
      request.method() === "POST",
  );
  await page.getByRole("button", { name: "Save entry", exact: true }).click();
  const stalePayload = (await publishRequest).postDataJSON();
  await expect(page.getByRole("status")).toContainText("Entry saved");
  saved = await db.communityContent.findUniqueOrThrow({
    where: { slug: "e2e-community-guide" },
  });
  expect(saved.status).toBe("PUBLISHED");
  expect((await anonymous.get(imageUrl)).status()).toBe(200);
  const listing = (
    await (await anonymous.get("/api/community")).json()
  ).entries.find((entry: { slug: string }) => entry.slug === saved.slug);
  expect(listing).toBeTruthy();
  expect(listing.editorNotes).toBeUndefined();
  expect(listing.reviewedBy).toBeUndefined();
  expect(
    (
      await page.request.post("/api/admin/community", { data: stalePayload })
    ).status(),
  ).toBe(409);
  const readerContext = await browser.newContext();
  const reader = await readerContext.newPage();
  await english(reader);
  await reader.goto("/community/e2e-community-guide");
  await expect(
    reader.getByRole("heading", { name: "Community test guide", exact: true }),
  ).toBeVisible();
  await expect(reader.locator('img[src="x"]')).toHaveCount(0);
  await expect(
    reader.getByText("Literal markup must remain text:", { exact: false }),
  ).toBeVisible();
  await readerContext.close();
  await page.getByLabel("Publication status").selectOption("ARCHIVED");
  await page.getByRole("button", { name: "Save entry", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Entry saved");
  expect((await anonymous.get(imageUrl)).status()).toBe(403);
  expect((await anonymous.get("/community/e2e-community-guide")).status()).toBe(
    404,
  );
  expect(
    await db.auditLog.count({
      where: { entityType: "CommunityContent", entityId: saved.id },
    }),
  ).toBe(3);
  await anonymous.dispose();
});

test("homepage settings publish in both languages and stale or unauthorized edits are refused", async ({
  page,
}) => {
  const anonymous = await playwrightRequest.newContext({
    baseURL: process.env.E2E_BASE_URL,
  });
  expect((await anonymous.get("/api/admin/community")).status()).toBe(401);
  expect(
    (await anonymous.post("/api/admin/settings", { data: {} })).status(),
  ).toBe(401);
  await login(page, false);
  expect((await page.request.get("/api/admin/community")).status()).toBe(403);
  expect(
    (await page.request.post("/api/admin/settings", { data: {} })).status(),
  ).toBe(403);
  await login(page, true);
  const before = (await (await page.request.get("/api/admin/settings")).json())
    .settings;
  await page.goto("/admin/community");
  await page
    .getByRole("button", { name: "Homepage & settings", exact: true })
    .click();
  await page
    .getByLabel("Notice (Marathi, optional)", { exact: true })
    .fill("ही केवळ स्थानिक चाचणी सूचना आहे.");
  await page
    .getByLabel("Notice (English, optional)", { exact: true })
    .fill("ISOLATED_QA_NOTICE");
  const saveRequest = page.waitForRequest(
    (request) =>
      request.url().endsWith("/api/admin/settings") &&
      request.method() === "POST",
  );
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  const oldPayload = (await saveRequest).postDataJSON();
  await expect(page.getByRole("status")).toContainText(
    "Website settings saved",
  );
  const published = (await (await anonymous.get("/api/site")).json()).settings;
  expect(published.noticeEn).toBe("ISOLATED_QA_NOTICE");
  expect(
    (
      await page.request.post("/api/admin/settings", { data: oldPayload })
    ).status(),
  ).toBe(409);
  await page.goto("/");
  await expect(
    page.getByText("ISOLATED_QA_NOTICE", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "मराठीमध्ये बदला", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "mr");
  await expect(
    page.getByText("ही केवळ स्थानिक चाचणी सूचना आहे.", { exact: true }),
  ).toBeVisible();
  const restore = await page.request.post("/api/admin/settings", {
    data: { ...before, revision: published.revision },
  });
  expect(restore.ok()).toBe(true);
  await anonymous.dispose();
});

test("official resources, case-insensitive directory links, metadata and public-only sitemap work", async ({
  page,
}) => {
  await english(page);
  await page.goto("/resources");
  await page
    .getByRole("searchbox", { name: "Search community resources", exact: true })
    .fill("scholarship");
  await expect(page.getByRole("status")).toContainText("2 entries");
  await page
    .getByRole("link", { name: "National Scholarship Portal", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "National Scholarship Portal",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Visit the official website/ }),
  ).toHaveAttribute("href", "https://scholarships.gov.in/Students");
  await page.goto("/directory?q=browser%20verified&sort=name");
  await expect(
    page.getByRole("heading", {
      name: "Browser Verified Workshop",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Sort by", exact: true }),
  ).toHaveValue("name");
  await expect(page).toHaveURL(/sort=name/);
  const insensitive = await (
    await page.request.get("/api/businesses?q=browser%20verified")
  ).json();
  expect(insensitive.businesses.length).toBeGreaterThan(0);
  expect((await page.request.get("/api/businesses?sort=bad")).status()).toBe(
    400,
  );
  expect((await page.request.get("/api/community?kind=bad")).status()).toBe(
    400,
  );
  const robots = await page.request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Disallow: /admin");
  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  expect(xml).toContain("/community/aagri-language-heritage");
  expect(xml).not.toContain("/community/e2e-community-guide");
  expect(xml).not.toContain("/api/files/");
  expect(xml).not.toContain("/dashboard");
  await page.goto("/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  for (const route of ["/register-business", "/advertise/book"]) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", {
        name: "Please sign in to continue",
        exact: true,
      }),
    ).toBeVisible();
  }
});
