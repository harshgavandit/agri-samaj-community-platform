import { z } from "zod";
import { contentKinds, type CommunityEntry } from "./community";
const cleanText = (min: number, max: number) =>
  z.string().trim().min(min).max(max);
const httpsUrl = z
  .string()
  .url()
  .max(1500)
  .refine((value) => value.startsWith("https://"), "Use a complete HTTPS URL");
export const sourceSchema = z.object({
  label: cleanText(2, 180),
  url: z.union([httpsUrl, z.literal("/Agri_SAMAJ_PDF.pdf")]),
});
export const communitySchema = z
  .object({
    id: z.string().uuid().optional(),
    revision: z.number().int().positive().optional(),
    slug: cleanText(3, 140).regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase words separated by hyphens",
    ),
    kind: z.enum(contentKinds),
    titleMr: cleanText(3, 180),
    titleEn: cleanText(0, 180).default(""),
    summaryMr: cleanText(0, 600).default(""),
    summaryEn: cleanText(0, 600).default(""),
    bodyMr: cleanText(0, 20000).default(""),
    bodyEn: cleanText(0, 20000).default(""),
    sources: z.array(sourceSchema).max(8).default([]),
    sourceNoteMr: cleanText(0, 600).default(""),
    sourceNoteEn: cleanText(0, 600).default(""),
    period: z.enum(["HISTORICAL", "CURRENT", "EVERGREEN"]),
    status: z
      .enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"])
      .default("DRAFT"),
    sourceVerified: z.boolean().default(false),
    featured: z.boolean().default(false),
    coverImageUrl: z
      .union([z.string().regex(/^\/api\/files\/[a-f0-9-]{36}$/), z.literal("")])
      .default(""),
    coverCredit: z.string().trim().max(500).default(""),
    actionUrl: z.union([httpsUrl, z.literal("")]).default(""),
    eventAt: z.union([z.string().datetime(), z.literal("")]).default(""),
    location: z.string().trim().max(300).default(""),
    editorNotes: z.string().trim().max(3000).default(""),
  })
  .superRefine((value, context) => {
    if (Boolean(value.sourceNoteMr) !== Boolean(value.sourceNoteEn))
      context.addIssue({
        code: "custom",
        path: ["sourceNoteMr"],
        message: "Provide source review notes in both languages",
      });
    if (
      ["REVIEW", "PUBLISHED"].includes(value.status) &&
      (value.titleEn.length < 3 ||
        value.summaryMr.length < 10 ||
        value.summaryEn.length < 10 ||
        value.bodyMr.length < 30 ||
        value.bodyEn.length < 30)
    )
      context.addIssue({
        code: "custom",
        path: ["bodyMr"],
        message:
          "Review and publication require titles, summaries and complete content in both languages",
      });
    if (
      value.status === "PUBLISHED" &&
      (!value.sourceVerified || value.sources.length === 0)
    )
      context.addIssue({
        code: "custom",
        path: ["sources"],
        message: "Verify at least one supporting source before publishing",
      });
    if (value.coverImageUrl && !value.coverCredit)
      context.addIssue({
        code: "custom",
        path: ["coverCredit"],
        message: "Confirm image permission and credit before attaching media",
      });
    if (
      value.kind === "EVENT" &&
      value.status === "PUBLISHED" &&
      (!value.eventAt || !value.location)
    )
      context.addIssue({
        code: "custom",
        path: ["eventAt"],
        message: "Published events need a date, time and location",
      });
  });
export const settingsSchema = z
  .object({
    heroTitleMr: cleanText(5, 180),
    heroTitleEn: cleanText(5, 180),
    heroDescriptionMr: cleanText(20, 700),
    heroDescriptionEn: cleanText(20, 700),
    noticeMr: z.string().trim().max(500),
    noticeEn: z.string().trim().max(500),
    contactEmail: z.union([z.string().trim().email().max(254), z.literal("")]),
    revision: z.number().int().positive(),
  })
  .refine(
    (value) => Boolean(value.noticeMr) === Boolean(value.noticeEn),
    "Provide notices in both Marathi and English",
  );
export function publicContent(
  value: Record<string, any>,
  includeBody = true,
): CommunityEntry {
  return {
    id: value.id,
    slug: value.slug,
    kind: value.kind,
    titleMr: value.titleMr,
    titleEn: value.titleEn,
    summaryMr: value.summaryMr,
    summaryEn: value.summaryEn,
    bodyMr: includeBody ? value.bodyMr : "",
    bodyEn: includeBody ? value.bodyEn : "",
    sources: z.array(sourceSchema).parse(value.sources),
    sourceNoteMr: value.sourceNoteMr || "",
    sourceNoteEn: value.sourceNoteEn || "",
    period: value.period,
    featured: value.featured,
    coverImageUrl: value.coverImageUrl,
    coverCredit: value.coverCredit,
    actionUrl: value.actionUrl,
    eventAt: value.eventAt?.toISOString() || null,
    location: value.location,
    verifiedAt: value.verifiedAt?.toISOString() || null,
    updatedAt: value.updatedAt.toISOString(),
  };
}
