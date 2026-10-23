import test from "node:test";
import assert from "node:assert/strict";
import {
  calendarText,
  eventCalendar,
  foldCalendarLine,
} from "../src/lib/event-calendar";
import {
  sortCommunityUpdates,
  type CommunityUpdate,
} from "../src/lib/community-events";

test("calendar escapes untrusted text and folds UTF-8 lines without splitting Marathi", () => {
  assert.equal(
    calendarText("Title\r\nBEGIN:VEVENT;test,\\"),
    "Title\\nBEGIN:VEVENT\\;test\\,\\\\",
  );
  const value = "SUMMARY:" + "आगरी समाज ".repeat(35);
  const folded = foldCalendarLine(value);
  assert(
    folded.split("\r\n").every((line) => Buffer.byteLength(line, "utf8") <= 75),
  );
  assert.equal(folded.replaceAll("\r\n ", ""), value);
});
test("calendar uses the actual event start and source link without inventing duration", () => {
  const text = eventCalendar(
    {
      slug: "community-gathering",
      titleMr: "आगरी समाज",
      titleEn: "Community gathering",
      summaryMr: "सारांश",
      summaryEn: "Published information",
      eventAt: new Date("2026-11-02T10:30:00Z"),
      updatedAt: new Date("2026-10-24T05:30:00Z"),
      location: "Panvel; main hall",
    },
    "en",
    "https://community.example.test",
  );
  assert.match(text, /DTSTART:20261102T103000Z/);
  assert.match(text, /DTSTAMP:20261024T053000Z/);
  assert.match(text, /LOCATION:Panvel\\; main hall/);
  assert.match(
    text,
    /URL:https:\/\/community.example.test\/community\/community-gathering/,
  );
  assert.doesNotMatch(text, /DTEND|DURATION|ATTENDEE/);
});
test("event discovery orders upcoming dates nearest first and keeps undated news out of date filters", () => {
  const item = (
    id: string,
    date: string | null,
    title = "Gathering",
  ): CommunityUpdate => ({
    id,
    date,
    titleEn: title,
    titleMr: "समाज",
    bodyEn: "Published update",
    bodyMr: "घडामोडी",
    changed: "2026-10-20T00:00:00Z",
    location: "Panvel",
    slug: id,
    calendar: !!date,
  });
  const items = [
    item("later", "2026-12-01T00:00:00Z"),
    item("past", "2026-09-01T00:00:00Z"),
    item("soon", "2026-11-01T00:00:00Z"),
    item("news", null, "Education news"),
  ];
  const now = Date.parse("2026-10-24T00:00:00Z");
  assert.deepEqual(
    sortCommunityUpdates(items, "upcoming", "", now).map((item) => item.id),
    ["soon", "later"],
  );
  assert.deepEqual(
    sortCommunityUpdates(items, "past", "", now).map((item) => item.id),
    ["past"],
  );
  assert.equal(
    sortCommunityUpdates(items, "all", "education", now)[0].id,
    "news",
  );
  assert.equal(sortCommunityUpdates(items, "all", "  Panvel ", now).length, 4);
});
