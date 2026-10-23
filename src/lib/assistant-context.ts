import { prisma } from "./prisma";
import type { AssistantSource } from "./assistant-contract";
import { getPublicAssistantCorpus } from "./public-data";

export type KnowledgeItem = AssistantSource & { text: string };
const help = [
  {
    title: "Register a business / व्यवसाय नोंदणी",
    url: "/register-business",
    text: "Create an account at /register, sign in at /login, then complete five steps: owner, business, address, operations and verification. Save incomplete work as a draft. Resume and track review from /dashboard. Accept the declaration before submitting. An administrator must approve a listing before it appears publicly. The assistant cannot submit, approve or check private application status.",
  },
  {
    title: "Business directory / व्यवसाय डिरेक्टरी",
    url: "/directory",
    text: "Browse administrator-approved local manufacturers, traders, contractors and professional services without signing in. Search by business name or service, category, district and classification. Sort by recent, name or oldest. View the business profile for its public contact details. Approval means platform administrator approval, not council endorsement.",
  },
  {
    title: "Education and careers / शिक्षण व करिअर",
    url: "/resources",
    text: "Browse published resources for scholarships, education, jobs, skills and entrepreneurship. Follow the linked official portal for current eligibility, application deadlines and applications. The platform does not award benefits, process applications or guarantee a job.",
  },
  {
    title: "Community and culture / समाज व संस्कृती",
    url: "/about",
    text: "Agri Samaj is the Agri/Aagri community, not a website limited to farming. Marathi and English content covers language, heritage, community organizations and initiatives. Culture is at /culture, initiatives at /initiatives and dated news/events at /news. Historical material is not evidence of current population or occupations. Confirm event details with the organizer.",
  },
  {
    title: "Advertisements / जाहिराती",
    url: "/advertise",
    text: "Choose an available advertisement package and send advertisement copy, optional artwork and a payment reference at /advertise/book. Payment details are manually reviewed by administrators; there is no automatic payment gateway or automatic publication. Signed-in members can track their bookings in /dashboard. Do not share bank details or payment proofs in chat.",
  },
  {
    title: "Publications / प्रकाशने",
    url: "/publications",
    text: "Browse public community directories, magazines and reports. Open a PDF when one is available. Publication contents retain their owners' rights.",
  },
  {
    title: "Contact and corrections / संपर्क",
    url: "/contact",
    text: "Use the contact form for questions, corrections, publication suggestions and account support. The assistant is AI, not an official representative, and cannot read private documents, reset passwords or take administrative actions. Do not send passwords, Aadhaar, financial details or personal verification documents in chat. The assistant has no live web browsing; official portal deadlines must be checked at the source.",
  },
];

const stop = new Set([
  "the",
  "and",
  "for",
  "how",
  "can",
  "are",
  "what",
  "with",
  "please",
  "this",
  "that",
  "have",
  "मला",
  "आहे",
  "आणि",
  "कसे",
  "करा",
  "आहेत",
]);
export function searchTerms(query: string) {
  return [
    ...new Set(query.toLocaleLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || []),
  ]
    .filter((t) => t.length > 1 && !stop.has(t))
    .slice(-14);
}
export function rankKnowledge(items: KnowledgeItem[], query: string) {
  const terms = searchTerms(query);
  return items
    .map((item, index) => ({
      item,
      index,
      score: terms.reduce(
        (score, term) =>
          score +
          (item.title.toLocaleLowerCase().includes(term) ? 8 : 0) +
          (item.text.toLocaleLowerCase().includes(term) ? 2 : 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .filter((item) => item.score > 0)
    .slice(0, 6)
    .map(({ item }) => item);
}

export async function assistantKnowledge(query: string, language: "mr" | "en") {
  const terms = searchTerms(query).slice(-6);
  const [articles, businesses, packages] = await Promise.all([
    getPublicAssistantCorpus(),
    terms.length
      ? prisma.businessProfile.findMany({
          where: {
            status: "APPROVED",
            OR: terms.flatMap((term) =>
              [
                "businessName",
                "businessNameEn",
                "productsServices",
                "productsServicesEn",
                "officeDistrict",
                "officeDistrictEn",
                "officeCity",
                "officeCityEn",
              ].map((field) => ({
                [field]: { contains: term, mode: "insensitive" as const },
              })),
            ),
          },
          select: {
            id: true,
            businessName: true,
            businessNameEn: true,
            productsServices: true,
            productsServicesEn: true,
            officeCity: true,
            officeCityEn: true,
            officeDistrict: true,
            officeDistrictEn: true,
          },
          orderBy: { publishedAt: "desc" },
          take: 5,
        })
      : [],
    /advertis|package|जाहिरा|दरपत्रक/i.test(query)
      ? prisma.advertisementPackage.findMany({
          where: { isActive: true, price: { gt: 0 } },
          select: { nameMr: true, nameEn: true, price: true, dimensions: true },
          orderBy: { order: "asc" },
          take: 8,
        })
      : [],
  ]);
  const articlesAndBusinesses: KnowledgeItem[] = [
    ...articles.map((entry, i) => ({
      id: `C${i + 1}`,
      title: language === "mr" ? entry.titleMr : entry.titleEn,
      url: `/community/${encodeURIComponent(entry.slug)}`,
      text: [
        entry.titleMr,
        entry.titleEn,
        entry.summaryMr,
        entry.summaryEn,
        (language === "mr" ? entry.bodyMr : entry.bodyEn).slice(0, 1800),
        language === "mr" ? entry.sourceNoteMr : entry.sourceNoteEn,
        entry.eventAt,
        entry.location,
      ]
        .filter(Boolean)
        .join("\n"),
    })),
    ...businesses.map((entry, i) => ({
      id: `B${i + 1}`,
      title:
        language === "mr"
          ? entry.businessName
          : entry.businessNameEn || entry.businessName,
      url: `/directory/${encodeURIComponent(entry.id)}`,
      text: [
        entry.businessName,
        entry.businessNameEn,
        entry.productsServices,
        entry.productsServicesEn,
        entry.officeCity,
        entry.officeDistrict,
        entry.officeCityEn,
        entry.officeDistrictEn,
      ]
        .filter(Boolean)
        .join("; ")
        .slice(0, 1200),
    })),
  ];
  const items: KnowledgeItem[] = [
    ...help.map((item, i) => ({ ...item, id: `H${i + 1}` })),
    ...rankKnowledge(articlesAndBusinesses, query),
  ];
  if (packages.length)
    items.push({
      id: "P1",
      title: "Current advertisement packages",
      url: "/advertise",
      text: packages
        .map(
          (p) => `${p.nameMr} / ${p.nameEn}: INR ${p.price}, ${p.dimensions}`,
        )
        .join("\n"),
    });
  return items;
}
