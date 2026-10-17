import type { Metadata } from "next";
import CommunityHub from "@/components/CommunityHub";
export const metadata: Metadata = {
  alternates: { canonical: "/initiatives" },
  title: "उपक्रम | Community Initiatives | Aagri Samaj",
  description: "स्रोतांसह समाजोपयोगी उपक्रम आणि सार्वजनिक विकास साधने.",
};
export default function Page() {
  return <CommunityHub section="initiatives" />;
}
