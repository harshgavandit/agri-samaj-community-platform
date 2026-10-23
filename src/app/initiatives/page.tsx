import type { Metadata } from "next";
import CommunityLanding from "@/components/CommunityLanding";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  alternates: { canonical: "/initiatives" },
  title: "उपक्रम | Community Initiatives | Aagri Samaj",
  description: "स्रोतांसह समाजोपयोगी उपक्रम आणि सार्वजनिक विकास साधने.",
};
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CommunityLanding section="initiatives" searchParams={searchParams} />;
}
