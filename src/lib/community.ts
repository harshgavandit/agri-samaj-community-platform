export const contentKinds = [
  "ABOUT",
  "CULTURE",
  "ORGANIZATION",
  "EDUCATION",
  "RESOURCE",
  "ACHIEVEMENT",
  "INITIATIVE",
  "EVENT",
  "NEWS",
] as const;
export type ContentKind = (typeof contentKinds)[number];
export const kindLabels: Record<ContentKind, { mr: string; en: string }> = {
  ABOUT: { mr: "आपला समाज", en: "Our community" },
  CULTURE: { mr: "संस्कृती व वारसा", en: "Culture & heritage" },
  ORGANIZATION: { mr: "संस्था", en: "Organizations" },
  EDUCATION: { mr: "शिक्षण व करिअर", en: "Education & careers" },
  RESOURCE: { mr: "उपयुक्त साधने", en: "Useful resources" },
  ACHIEVEMENT: { mr: "कर्तृत्व", en: "Community achievements" },
  INITIATIVE: { mr: "उपक्रम", en: "Initiatives" },
  EVENT: { mr: "कार्यक्रम", en: "Events" },
  NEWS: { mr: "बातम्या", en: "News" },
};
export const defaultSettings = {
  id: "public",
  heroTitleMr: "आपला वारसा.\nआपली माणसं. आपली प्रगती.",
  heroTitleEn: "Rooted in heritage.\nConnected for tomorrow.",
  heroDescriptionMr:
    "आगरी समाजाची संस्कृती जाणून घ्या, आपल्या परिसरातील उद्योजकांशी जोडा आणि शिक्षण व करिअरच्या नव्या वाटा शोधा.",
  heroDescriptionEn:
    "Discover Aagri heritage, connect with local entrepreneurs, and find trusted resources for learning, work and a shared future.",
  noticeMr: "",
  noticeEn: "",
  contactEmail: "",
  revision: 1,
};
export type PublicSettings = typeof defaultSettings;
export interface ContentSource {
  label: string;
  url: string;
}
export interface CommunityEntry {
  id: string;
  slug: string;
  kind: ContentKind;
  titleMr: string;
  titleEn: string;
  summaryMr: string;
  summaryEn: string;
  bodyMr: string;
  bodyEn: string;
  sources: ContentSource[];
  sourceNoteMr: string;
  sourceNoteEn: string;
  period: string;
  featured: boolean;
  coverImageUrl: string | null;
  coverCredit: string | null;
  actionUrl: string | null;
  eventAt: string | null;
  location: string | null;
  verifiedAt: string | null;
  updatedAt: string;
}
