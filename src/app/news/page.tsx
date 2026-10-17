import type { Metadata } from "next";
import NewsEvents from "@/components/NewsEvents";
export const metadata: Metadata = {
  alternates: { canonical: "/news" },
  title: "बातम्या व कार्यक्रम | News & Events | Aagri Samaj",
  description: "प्रकाशित समुदाय बातम्या, आगामी कार्यक्रम आणि मागील उपक्रम.",
};
export default function Page() {
  return <NewsEvents />;
}
