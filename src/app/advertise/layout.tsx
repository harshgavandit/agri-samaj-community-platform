import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "जाहिरात व प्रायोजकत्व | Advertising | Aagri Samaj",
  description:
    "प्रकाशित जाहिरात पॅकेज आणि प्रायोजकत्वाचे पर्याय पाहा. Explore published advertising packages.",
  alternates: { canonical: "/advertise" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
