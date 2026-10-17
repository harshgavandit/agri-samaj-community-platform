import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const business = await prisma.businessProfile.findFirst({
    where: { id, status: "APPROVED" },
    select: {
      businessName: true,
      businessNameEn: true,
      productsServices: true,
    },
  });
  return business
    ? {
        title:
          (business.businessNameEn || business.businessName) + " | Aagri Samaj",
        description: business.productsServices.slice(0, 160),
        alternates: { canonical: "/directory/" + id },
      }
    : {
        title: "Business not found | Aagri Samaj",
        robots: { index: false, follow: false },
      };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
