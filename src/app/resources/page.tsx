import type { Metadata } from "next";
import CommunityLanding from "@/components/CommunityLanding";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  alternates: { canonical: "/resources" },
  title:
    "शिक्षण, करिअर व सार्वजनिक साधने | Education, Careers & Resources | Aagri Samaj",
  description:
    "आगरी समाजासाठी स्रोतांसह माहिती आणि उपयुक्त साधने. Sourced community information and useful public resources.",
};
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CommunityLanding section="resources" searchParams={searchParams} />;
}
