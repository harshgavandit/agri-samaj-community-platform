import { test, expect, request as playwrightRequest } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const database = new URL(process.env.DATABASE_URL || "http://invalid");
if (
  !["localhost", "127.0.0.1"].includes(database.hostname) ||
  !database.searchParams.get("schema")?.startsWith("e2e_")
)
  throw new Error("Community fixtures require an isolated local e2e schema.");
const baseURL = process.env.E2E_BASE_URL!;
test.beforeEach(async () => {
  await db.rateLimit.deleteMany();
});
test.afterAll(async () => {
  await db.$disconnect();
});
const eventData = {
  slug: "community-calendar-test",
  kind: "EVENT",
  titleMr: "समुदाय कॅलेंडर चाचणी",
  titleEn: "Community calendar test",
  summaryMr: "प्रकाशित कार्यक्रमाची अधिकृत माहिती येथे दिली आहे.",
  summaryEn:
    "Published details of a community gathering for calendar verification.",
  bodyMr: "समुदाय कार्यक्रमाची सविस्तर माहिती.",
  bodyEn: "Full community gathering details.",
  status: "PUBLISHED",
  sourceVerified: true,
  period: "CURRENT",
  sources: [{ label: "Organizer reference", url: "https://example.org/event" }],
  sourceNoteMr: "चाचणीतील स्रोत नोंद.",
  sourceNoteEn: "Isolated verification source.",
  verifiedAt: new Date(),
  eventAt: new Date("2027-02-11T10:30:00Z"),
  location: "Panvel",
};
async function admin() {
  const api = await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: { origin: baseURL },
  });
  expect(
    (
      await api.post("/api/auth/login", {
        data: {
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        },
      })
    ).ok(),
  ).toBeTruthy();
  return api;
}

test("published pages include real community content in server HTML without client data waterfalls", async ({
  page,
  request,
}) => {
  const initial = await request.get("/culture");
  expect(initial.ok()).toBeTruthy();
  // Published seed content must be present in rendered HTML even before scripts run.
  expect(await initial.text()).toContain("aagri-language-heritage");
  const dataRequests: string[] = [];
  page.on("request", (request) => {
    if (
      /\/api\/(community|businesses|categories|announcements)(\?|$)/.test(
        request.url(),
      )
    )
      dataRequests.push(request.url());
  });
  await page.goto("/");
  await page.getByRole("main").getByRole("heading", { level: 1 }).waitFor();
  await expect(page.locator(".loading-card")).toHaveCount(0);
  expect(dataRequests).toEqual([]);
  const siteSchema = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  expect(JSON.parse(siteSchema!)["@type"]).toBe("WebSite");
});

test("published source-verified events export real calendar data and archived events stop exporting", async ({
  page,
  request,
}) => {
  const api = await admin();
  try {
    const saved = await api.post("/api/admin/community", {
      data: {
        ...eventData,
        eventAt: eventData.eventAt.toISOString(),
        verifiedAt: eventData.verifiedAt.toISOString(),
      },
    });
    expect(saved.status(), await saved.text()).toBe(200);
    const entry = (await saved.json()).entry;
    const calendar = await request.get(
      `/api/community/${eventData.slug}/calendar?language=mr`,
    );
    expect(calendar.status()).toBe(200);
    expect(calendar.headers()["content-type"]).toContain("text/calendar");
    expect(await calendar.text()).toContain("DTSTART:20270211T103000Z");
    expect(await calendar.text()).toContain("BEGIN:VEVENT");
    expect(
      (
        await request.get(
          `/api/community/${eventData.slug}/calendar?language=fr`,
        )
      ).status(),
    ).toBe(400);
    await page.addInitScript(() =>
      localStorage.setItem("agri_samaj_lang", "en"),
    );
    await page.goto("/news?period=upcoming&q=calendar");
    await expect(
      page.getByRole("heading", { name: eventData.titleEn, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Upcoming events", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    const download = page.waitForEvent("download");
    await page
      .getByRole("link", { name: "Add to calendar", exact: true })
      .click();
    expect((await download).suggestedFilename()).toBe(`${eventData.slug}.ics`);
    await page.goto(`/community/${eventData.slug}`);
    await expect(
      page.getByRole("link", { name: "Add to calendar", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", {
        name: "Suggest a correction to this information",
        exact: true,
      })
      .click();
    await expect(page.locator('[name="subject"]')).toHaveValue(
      `Correction: ${eventData.titleEn}`,
    );
    // Administrative changes go through the real API so shared caches invalidate.
    expect(
      (
        await api.post("/api/admin/community", {
          data: {
            ...eventData,
            id: entry.id,
            revision: entry.revision,
            status: "ARCHIVED",
            eventAt: eventData.eventAt.toISOString(),
            verifiedAt: eventData.verifiedAt.toISOString(),
          },
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await request.get(
          `/api/community/${eventData.slug}/calendar?language=en`,
        )
      ).status(),
    ).toBe(404);
    expect(
      await (await request.get("/news?period=upcoming&q=calendar")).text(),
    ).not.toContain(`href="/community/${eventData.slug}"`);
  } finally {
    await api.dispose();
  }
});

test("community search URL survives reload and homepage service/location search is shareable", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("agri_samaj_lang", "en"));
  await page.goto("/resources?q=scholarship");
  const search = page.getByRole("searchbox", {
    name: "Search community resources",
    exact: true,
  });
  await expect(search).toHaveValue("scholarship");
  await search.fill("career");
  await expect(page).toHaveURL(/q=career/);
  await page.reload();
  await expect(search).toHaveValue("career");
  await page.goto("/");
  await page.locator("#home-business-search").fill("contractor");
  await page.locator("#home-business-district").selectOption("रायगड");
  await page
    .getByRole("button", { name: "Search businesses", exact: true })
    .click();
  await expect(page).toHaveURL(/\/directory\?/);
  expect(new URL(page.url()).searchParams.get("q")).toBe("contractor");
  expect(new URL(page.url()).searchParams.get("district")).toBe("रायगड");
});

test("resources remain searchable beyond one hundred entries and pagination survives navigation", async ({
  page,
  request,
}) => {
  const fixturePrefix = "scaling-resource-";
  const rows = Array.from({ length: 121 }, (_, index) => ({
    ...eventData,
    slug: `${fixturePrefix}${String(index).padStart(3, "0")}`,
    kind: "RESOURCE",
    titleEn: `Scale resource ${String(index).padStart(3, "0")}`,
    bodyEn: `Full content lookup token ${index}`,
    titleMr: `साधन ${index}`,
    eventAt: null,
    period: "EVERGREEN",
    sources: JSON.parse(JSON.stringify(eventData.sources)),
  }));
  await db.communityContent.createMany({ data: rows });
  try {
    const first = await request.get(
      "/api/community?kinds=RESOURCE&q=Scale%20resource&page=1&limit=12",
    );
    expect(first.status()).toBe(200);
    const data = await first.json();
    expect(data.pagination.total).toBe(121);
    expect(data.entries).toHaveLength(12);
    const last = await request.get(
      "/api/community?kinds=RESOURCE&q=Scale%20resource&page=11&limit=12",
    );
    expect((await last.json()).entries).toHaveLength(1);
    await page.addInitScript(() =>
      localStorage.setItem("agri_samaj_lang", "en"),
    );
    await page.goto("/resources?q=Scale%20resource");
    await expect(page.locator(".editorial-card")).toHaveCount(12);
    const pagination = page.getByRole("navigation", { name: /pagination/i });
    await pagination.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator(".editorial-card")).toHaveCount(12);
    await page.reload();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator(".editorial-card")).toHaveCount(12);
    const search = page.getByRole("searchbox", {
      name: "Search community resources",
      exact: true,
    });
    await search.fill("Scale resource 120");
    await expect(page).toHaveURL(/q=Scale/);
    await expect(
      page.getByRole("heading", { name: "Scale resource 120", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".editorial-card")).toHaveCount(1);
    await search.fill("Full content lookup token 120");
    await expect(page).toHaveURL(/q=Full\+content\+lookup\+token\+120/);
    await expect(
      page.getByRole("heading", { name: "Scale resource 120", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".editorial-card")).toHaveCount(1);
    await page.goBack();
    await expect(search).toHaveValue("Scale resource");
    await expect(page.locator(".editorial-card")).toHaveCount(12);
  } finally {
    await db.communityContent.deleteMany({
      where: { slug: { startsWith: fixturePrefix } },
    });
  }
});

test("news uses one chronological page window across announcements and community events", async ({
  page,
  request,
}) => {
  const prefix = "cross-source-sequence-";
  const query = "Cross source sequence";
  await db.announcement.createMany({
    data: Array.from({ length: 13 }, (_, index) => ({
      slug: `${prefix}notice-${index}`,
      titleMr: `कार्यक्रम ${index + 1}`,
      titleEn: `${query} January ${String(index + 1).padStart(2, "0")}`,
      contentMr: "स्थानिक चाचणीतील कार्यक्रम.",
      contentEn: "Isolated chronological pagination fixture.",
      category: "EVENT",
      eventDate: new Date(Date.UTC(2028, 0, index + 1, 10)),
      isPublished: true,
    })),
  });
  await db.communityContent.createMany({
    data: Array.from({ length: 13 }, (_, index) => ({
      ...eventData,
      slug: `${prefix}article-${index}`,
      titleEn: `${query} December ${String(index + 1).padStart(2, "0")}`,
      eventAt: new Date(Date.UTC(2028, 11, index + 1, 10)),
    })),
  });
  try {
    const options = `period=upcoming&q=${encodeURIComponent(query)}&limit=12`;
    const first = await request.get(`/api/updates?${options}&page=1`);
    expect(first.status()).toBe(200);
    const firstData = await first.json();
    expect(firstData.pagination.total).toBe(26);
    expect(firstData.pagination.totalPages).toBe(3);
    expect(firstData.announcements).toHaveLength(12);
    expect(firstData.entries).toHaveLength(0);
    const second = await request.get(`/api/updates?${options}&page=2`);
    const secondData = await second.json();
    expect(secondData.announcements).toHaveLength(1);
    expect(secondData.announcements[0].titleEn).toBe(`${query} January 13`);
    expect(secondData.entries).toHaveLength(11);
    await page.addInitScript(() =>
      localStorage.setItem("agri_samaj_lang", "en"),
    );
    await page.goto(`/news?${options}&page=2`);
    await expect(
      page.getByRole("heading", { name: `${query} January 13`, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `${query} December 12`, exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("navigation", { name: "Updates pagination" })
      .getByRole("button", { name: "Next", exact: true })
      .click();
    await expect(page).toHaveURL(/page=3/);
    await expect(
      page.getByRole("heading", { name: `${query} December 12`, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `${query} January 13`, exact: true }),
    ).toHaveCount(0);
  } finally {
    await db.announcement.deleteMany({
      where: { slug: { startsWith: prefix } },
    });
    await db.communityContent.deleteMany({
      where: { slug: { startsWith: prefix } },
    });
  }
});
