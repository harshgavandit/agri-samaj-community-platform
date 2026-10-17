import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "डिजिटल प्रकाशने | Digital Publications | Aagri Samaj",
  description:
    "प्रकाशित डिरेक्टरी आणि ऐतिहासिक समुदाय साहित्य वाचा. Read published directories and historical community material.",
  alternates: { canonical: "/publications" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
