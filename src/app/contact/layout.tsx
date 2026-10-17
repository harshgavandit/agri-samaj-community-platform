import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "संपर्क व अभिप्राय | Contact & Feedback | Aagri Samaj",
  description:
    "समुदाय व्यासपीठाच्या टीमला संदेश, सूचना किंवा अभिप्राय पाठवा. Contact the community platform team.",
  alternates: { canonical: "/contact" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
