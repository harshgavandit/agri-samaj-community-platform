import type { Metadata } from "next";
import CommunityLanding from "@/components/CommunityLanding";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "आपला समाज | Our Community | Aagri Samaj",
  description:
    "आगरी समाजासाठी स्रोतांसह माहिती आणि उपयुक्त साधने. Sourced community information and useful public resources.",
};
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CommunityLanding section="about" searchParams={searchParams} />;
}
