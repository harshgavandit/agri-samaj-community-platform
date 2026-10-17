import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "उद्योजक डिरेक्टरी | Business Directory | Aagri Samaj",
  description:
    "आगरी समाजातील प्रशासक-मंजूर व्यवसाय, सेवा, क्षेत्र आणि ठिकाणानुसार शोधा. Find approved community businesses.",
  alternates: { canonical: "/directory" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
