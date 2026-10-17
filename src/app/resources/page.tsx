import type { Metadata } from "next";
import CommunityHub from "@/components/CommunityHub";
export const metadata: Metadata = {
  alternates: { canonical: "/resources" },
  title:
    "शिक्षण, करिअर व सार्वजनिक साधने | Education, Careers & Resources | Aagri Samaj",
  description:
    "आगरी समाजासाठी स्रोतांसह माहिती आणि उपयुक्त साधने. Sourced community information and useful public resources.",
};
export default function Page() {
  return <CommunityHub section="resources" />;
}
