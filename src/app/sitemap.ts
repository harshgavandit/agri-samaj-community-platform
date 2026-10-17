import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteOrigin } from "@/lib/site";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const [content, businesses] = await Promise.all([
    prisma.communityContent.findMany({
      where: { status: "PUBLISHED", sourceVerified: true },
      select: { slug: true, updatedAt: true },
      take: 10000,
    }),
    prisma.businessProfile.findMany({
      where: { status: "APPROVED" },
      select: { id: true, updatedAt: true },
      take: 10000,
    }),
  ]);
  return [
    ...[
      "",
      "/about",
      "/culture",
      "/directory",
      "/resources",
      "/news",
      "/initiatives",
      "/publications",
      "/advertise",
      "/contact",
      "/privacy",
    ].map((path) => ({
      url: origin + path,
      changeFrequency: "weekly" as const,
      priority: path ? 0.7 : 1,
    })),
    ...content.map((entry) => ({
      url: origin + "/community/" + entry.slug,
      lastModified: entry.updatedAt,
    })),
    ...businesses.map((entry) => ({
      url: origin + "/directory/" + entry.id,
      lastModified: entry.updatedAt,
    })),
  ];
}
