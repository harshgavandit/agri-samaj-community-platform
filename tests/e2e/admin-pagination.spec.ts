import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const db = new PrismaClient();
const database = new URL(process.env.DATABASE_URL || "http://invalid");
if (
  !["localhost", "127.0.0.1"].includes(database.hostname) ||
  !database.searchParams.get("schema")?.startsWith("e2e_")
)
  throw new Error(
    "Admin pagination fixtures require an isolated local e2e schema.",
  );

async function adminLogin(page: Page) {
  await db.rateLimit.deleteMany();
  await page.addInitScript(() => localStorage.setItem("agri_samaj_lang", "en"));
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel(/^Password/).fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: /Sign In|Login/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.afterAll(async () => db.$disconnect());

test("admin business search and pagination use complete server-filtered results", async ({
  page,
  browser,
}) => {
  const prefix = `Paging-${randomUUID().slice(0, 8)}`;
  const [owner, category] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { email: process.env.ADMIN_EMAIL! } }),
    db.businessCategory.findFirstOrThrow({ where: { isActive: true } }),
  ]);
  await db.businessProfile.createMany({
    data: Array.from({ length: 27 }, (_, index) => ({
      userId: owner.id,
      categoryId: category.id,
      refNumber: `${prefix}-${index}`,
      status: "PENDING",
      ownerName: "Pagination QA",
      ownerPhone: "9999999999",
      businessName: `${prefix} Workshop ${index}`,
      productsServices: "Isolated pagination fixture",
      officeAddress: "Private test address",
      officeCity: "Panvel",
      officeTaluka: "Panvel",
      officeDistrict: "Raigad",
      officePincode: "410206",
      isAddressPublic: false,
    })),
  });
  try {
    await adminLogin(page);
    await page.goto("/admin/businesses?status=PENDING");
    await page
      .getByRole("searchbox", { name: "Search applications" })
      .fill(prefix);
    const pagination = page.getByRole("navigation", {
      name: "Results pagination",
    });
    await expect(pagination).toContainText("1–25 of 27 results");
    await expect(
      page.getByRole("button", { name: "Review / Action" }),
    ).toHaveCount(25);
    await pagination.getByRole("button", { name: "Next", exact: true }).click();
    await expect(pagination).toContainText("26–27 of 27 results");
    await expect(
      page.getByRole("button", { name: "Review / Action" }),
    ).toHaveCount(2);
    await pagination.getByRole("button", { name: "Previous" }).click();
    await expect(pagination).toContainText("1–25 of 27 results");
    const response = await page.request.get(
      `/api/admin/businesses?q=${prefix}&status=PENDING&page=2&limit=1`,
    );
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.businesses).toHaveLength(1);
    expect(data.pagination).toEqual({
      page: 2,
      limit: 1,
      total: 27,
      totalPages: 27,
    });
    expect(
      (await page.request.get("/api/admin/businesses?limit=101")).status(),
    ).toBe(400);
    expect(
      (await page.request.get("/api/admin/businesses?status=INVALID")).status(),
    ).toBe(400);
    const anonymous = await browser.newContext({
      baseURL: process.env.E2E_BASE_URL,
    });
    expect(
      (await anonymous.request.get("/api/admin/businesses")).status(),
    ).toBe(401);
    await anonymous.close();
  } finally {
    await db.businessProfile.deleteMany({
      where: { refNumber: { startsWith: prefix } },
    });
  }
});

test("admin inquiry status and search filters paginate without losing older messages", async ({
  page,
}) => {
  const prefix = `Inquiry-${randomUUID().slice(0, 8)}`;
  await db.contactInquiry.createMany({
    data: Array.from({ length: 27 }, (_, index) => ({
      name: `${prefix} ${index}`,
      email: `pagination-${index}@example.test`,
      subject: prefix,
      message: "A local pagination fixture inquiry.",
      status: "NEW",
    })),
  });
  try {
    await adminLogin(page);
    await page.goto("/admin/inquiries");
    await page.getByRole("combobox", { name: "Status" }).selectOption("NEW");
    await page
      .getByRole("searchbox", { name: "Search", exact: true })
      .fill(prefix);
    const pagination = page.getByRole("navigation", {
      name: "Results pagination",
    });
    await expect(pagination).toContainText("1–25 of 27 results");
    await pagination.getByRole("button", { name: "Next", exact: true }).click();
    await expect(pagination).toContainText("26–27 of 27 results");
    await expect(
      page.getByRole("button", { name: "Mark Resolved", exact: true }),
    ).toHaveCount(2);
    await page
      .getByRole("combobox", { name: "Status" })
      .selectOption("RESOLVED");
    await expect(pagination).toContainText("0–0 of 0 results");
    await expect(
      page.getByText("No inquiries match these filters."),
    ).toBeVisible();
    const response = await page.request.get(
      `/api/admin/inquiries?q=${prefix}&status=NEW&page=2&limit=1`,
    );
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.inquiries).toHaveLength(1);
    expect(data.pagination).toEqual({
      page: 2,
      limit: 1,
      total: 27,
      totalPages: 27,
    });
    expect(
      (await page.request.get("/api/admin/inquiries?page=0")).status(),
    ).toBe(400);
    expect(
      (await page.request.get("/api/admin/inquiries?status=INVALID")).status(),
    ).toBe(400);
  } finally {
    await db.contactInquiry.deleteMany({ where: { subject: prefix } });
  }
});
