import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { hashPassword } from "../../src/lib/auth";

const db = new PrismaClient();
const database = new URL(process.env.DATABASE_URL || "http://invalid");
if (
  !["localhost", "127.0.0.1"].includes(database.hostname) ||
  !database.searchParams.get("schema")?.startsWith("e2e_")
)
  throw new Error("Directory fixtures require an isolated local e2e schema.");
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3107";
const password = `Shortlist-${process.env.E2E_RUN_ID}!`;

test.beforeEach(async () => {
  await db.rateLimit.deleteMany();
});
test.afterAll(async () => {
  await db.$disconnect();
});

async function member() {
  const id = randomUUID();
  const account = await db.user.create({
    data: {
      id,
      email: `${id}@example.test`,
      name: "Directory test member",
      passwordHash: await hashPassword(password),
    },
  });
  const api = await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL },
  });
  const login = await api.post("/api/auth/login", {
    data: { email: account.email, password },
  });
  expect(login.ok()).toBeTruthy();
  return { account, api };
}

async function listing(
  ownerId: string,
  overrides: Record<string, unknown> = {},
) {
  const category = await db.businessCategory.findFirstOrThrow({
    where: { isActive: true },
  });
  return db.businessProfile.create({
    data: {
      userId: ownerId,
      refNumber: `E2E-SAVED-${randomUUID()}`,
      status: "APPROVED",
      ownerName: "Shortlist owner",
      ownerPhone: "9999999999",
      businessName: "Shortlist Design Studio",
      businessNameEn: "Shortlist Design Studio",
      categoryId: category.id,
      productsServices: "Directory shortlist services",
      productsServicesEn: "Directory shortlist services",
      officeAddress: "PRIVATE SHORTLIST ADDRESS",
      officeCity: "पनवेल",
      officeTaluka: "पनवेल",
      officeDistrict: "रायगड",
      officePincode: "410206",
      isAddressPublic: false,
      termsAccepted: true,
      adminNotes: "PRIVATE ADMIN REVIEW",
      documentUrl: "/api/files/private-shortlist-document",
      publishedAt: new Date(),
      ...overrides,
    },
  });
}

async function saved(api: APIRequestContext) {
  const response = await api.get("/api/saved-businesses");
  expect(response.ok()).toBeTruthy();
  return response.json();
}

test("private shortlists enforce authentication, member isolation, approval, projection, CSRF and idempotency", async ({
  request,
}) => {
  expect((await request.get("/api/saved-businesses")).status()).toBe(401);
  expect((await request.put("/api/saved-businesses/unknown")).status()).toBe(
    401,
  );
  expect((await request.delete("/api/saved-businesses/unknown")).status()).toBe(
    401,
  );
  const first = await member();
  const second = await member();
  try {
    const approved = await listing(first.account.id);
    const draft = await listing(first.account.id, { status: "DRAFT" });
    const endpoint = `/api/saved-businesses/${approved.id}`;
    expect(
      (await first.api.put(`/api/saved-businesses/${draft.id}`)).status(),
    ).toBe(404);
    expect(
      (await first.api.put("/api/saved-businesses/not-a-listing")).status(),
    ).toBe(404);
    const repeated = await Promise.all(
      Array.from({ length: 4 }, () => first.api.put(endpoint)),
    );
    expect(repeated.every((response) => response.ok())).toBeTruthy();
    expect(
      await db.savedBusiness.count({
        where: { userId: first.account.id, businessProfileId: approved.id },
      }),
    ).toBe(1);
    const result = await saved(first.api);
    expect(result.savedIds).toEqual([approved.id]);
    expect(result.businesses).toHaveLength(1);
    for (const field of [
      "ownerPhone",
      "ownerEmail",
      "documentUrl",
      "adminNotes",
      "userId",
      "officeAddress",
      "officePincode",
    ])
      expect(result.businesses[0]).not.toHaveProperty(field);
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
    expect((await saved(second.api)).businesses).toEqual([]);
    expect((await second.api.delete(endpoint)).ok()).toBeTruthy();
    expect((await saved(first.api)).savedIds).toEqual([approved.id]);
    expect(
      (
        await first.api.put(endpoint, {
          headers: {
            Origin: "https://untrusted.example",
            "Sec-Fetch-Site": "cross-site",
          },
        })
      ).status(),
    ).toBe(403);
    await db.businessProfile.update({
      where: { id: approved.id },
      data: { status: "REVISION_REQUIRED" },
    });
    expect((await saved(first.api)).businesses).toEqual([]);
    expect((await saved(first.api)).unavailableCount).toBe(1);
    expect(
      (await second.api.delete("/api/saved-businesses")).ok(),
    ).toBeTruthy();
    expect((await saved(first.api)).unavailableCount).toBe(1);
    expect((await first.api.delete("/api/saved-businesses")).ok()).toBeTruthy();
    expect((await saved(first.api)).unavailableCount).toBe(0);
    expect(
      (await first.api.get("/api/saved-businesses?view=ids")).ok(),
    ).toBeTruthy();
    expect((await first.api.put(endpoint)).status()).toBe(404);
    expect((await first.api.delete(endpoint)).ok()).toBeTruthy();
    expect((await first.api.delete(endpoint)).ok()).toBeTruthy();
  } finally {
    await first.api.dispose();
    await second.api.dispose();
  }
});

test("concurrent saves preserve the per-member PostgreSQL shortlist cap", async () => {
  const { account, api } = await member();
  try {
    const template = await listing(account.id);
    const { id: ignoredId, ...fields } = template;
    expect(ignoredId).toBeTruthy();
    const rows = Array.from({ length: 100 }, () => ({
      ...fields,
      id: randomUUID(),
      refNumber: `E2E-CAP-${randomUUID()}`,
    }));
    await db.businessProfile.createMany({ data: rows });
    await db.savedBusiness.createMany({
      data: rows.slice(0, 99).map((business) => ({
        userId: account.id,
        businessProfileId: business.id,
      })),
    });
    const responses = await Promise.all([
      api.put(`/api/saved-businesses/${template.id}`),
      api.put(`/api/saved-businesses/${rows[99].id}`),
    ]);
    expect(responses.map((response) => response.status()).sort()).toEqual([
      200, 409,
    ]);
    expect(
      await db.savedBusiness.count({ where: { userId: account.id } }),
    ).toBe(100);
    expect(
      (await api.put(`/api/saved-businesses/${rows[0].id}`)).status(),
    ).toBe(200);
    expect(
      (await api.delete(`/api/saved-businesses/${rows[0].id}`)).status(),
    ).toBe(200);
    expect(
      (await api.delete(`/api/saved-businesses/${rows[0].id}`)).status(),
    ).toBe(200);
    expect(
      await db.savedBusiness.count({ where: { userId: account.id } }),
    ).toBe(99);
  } finally {
    await api.dispose();
  }
});

test("directory filters survive navigation and member saves persist on the mobile dashboard", async ({
  page,
}) => {
  const { account, api } = await member();
  try {
    const business = await listing(account.id, {
      businessName: "Shortlist Journey Workshop",
      businessNameEn: "Shortlist Journey Workshop",
    });
    await page.addInitScript(() =>
      localStorage.setItem("agri_samaj_lang", "en"),
    );
    await page.context().addCookies((await api.storageState()).cookies);
    await page.goto("/directory?q=Shortlist+Journey&sort=name");
    await expect(
      page.getByRole("heading", { name: business.businessName, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "District", exact: true })
      .selectOption("रायगड");
    await expect(page).toHaveURL(/district=/);
    await page
      .getByRole("combobox", { name: "Classification", exact: true })
      .selectOption("PROFESSIONAL");
    await expect(
      page.getByRole("heading", {
        name: /No businesses found matching your criteria/,
      }),
    ).toBeVisible();
    await page.goBack();
    await expect(
      page.getByRole("combobox", { name: "Classification", exact: true }),
    ).toHaveValue("");
    await expect(
      page.getByRole("heading", { name: business.businessName, exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("combobox", { name: "Sort by", exact: true }),
    ).toHaveValue("name");
    await expect(page.getByRole("searchbox")).toHaveValue("Shortlist Journey");
    const save = page.getByRole("button", {
      name: `Save ${business.businessName}`,
      exact: true,
    });
    await expect(save).toBeEnabled();
    await save.click();
    await expect(
      page.getByRole("button", {
        name: `Remove ${business.businessName} from saved businesses`,
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard#saved-businesses");
    await expect(
      page
        .locator("#saved-businesses")
        .getByRole("heading", { name: business.businessName, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    const accessibility = await new AxeBuilder({ page })
      .include("#saved-businesses")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    await page
      .getByRole("button", {
        name: `Remove ${business.businessName} from saved businesses`,
        exact: true,
      })
      .click();
    await expect(
      page
        .locator("#saved-businesses")
        .getByRole("heading", { name: business.businessName, exact: true }),
    ).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "Keep useful contacts close",
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    await api.dispose();
  }
});
