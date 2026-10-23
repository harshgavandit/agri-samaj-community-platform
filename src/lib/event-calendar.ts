type CalendarEntry = {
  slug: string;
  titleMr: string;
  titleEn: string;
  summaryMr: string;
  summaryEn: string;
  eventAt: Date;
  updatedAt: Date;
  location: string | null;
};

// RFC 5545 text escaping and UTF-8 folding keep user-authored event titles from
// injecting calendar properties, without splitting Devanagari byte sequences.
export function calendarText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
}
export function foldCalendarLine(value: string) {
  const lines: string[] = [];
  let current = "",
    bytes = 0;
  for (const point of value) {
    const size = new TextEncoder().encode(point).length;
    if (bytes + size > 75) {
      lines.push(current);
      current = " ";
      bytes = 1;
    }
    current += point;
    bytes += size;
  }
  lines.push(current);
  return lines.join("\r\n");
}
export function eventCalendar(
  entry: CalendarEntry,
  language: "mr" | "en",
  origin: string,
) {
  const date = (value: Date) =>
    value
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const title = language === "mr" ? entry.titleMr : entry.titleEn;
  const summary = language === "mr" ? entry.summaryMr : entry.summaryEn;
  const url = `${new URL(origin).origin}/community/${encodeURIComponent(entry.slug)}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agri Samaj//Community Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${entry.slug}@${new URL(origin).hostname}`,
    `DTSTAMP:${date(entry.updatedAt)}`,
    `DTSTART:${date(entry.eventAt)}`,
    `SUMMARY:${calendarText(title)}`,
    `DESCRIPTION:${calendarText(`${summary}\n\n${url}\nConfirm current details with the organizer before attending.`)}`,
    ...(entry.location ? [`LOCATION:${calendarText(entry.location)}`] : []),
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .map(foldCalendarLine)
    .join("\r\n");
}
