import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import CommunityArticle from "@/components/CommunityArticle";
import { publicContent } from "@/lib/community-validation";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
const findEntry = cache(async (slug: string) =>
  prisma.communityContent.findFirst({
    where: { slug, status: "PUBLISHED", sourceVerified: true },
  }),
);
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const entry = await findEntry((await params).slug);
  return entry
    ? {
        title: `${entry.titleMr} | Aagri Samaj`,
        description: entry.summaryMr,
        alternates: { canonical: "/community/" + entry.slug },
      }
    : { title: "माहिती सापडली नाही | Aagri Samaj", robots: { index: false } };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const entry = await findEntry((await params).slug);
  if (!entry) notFound();
  return <CommunityArticle entry={publicContent(entry)} />;
}
