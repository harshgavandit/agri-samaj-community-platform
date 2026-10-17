import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "गोपनीयता | Privacy | Aagri Samaj",
  description:
    "खासगी माहिती, कागदपत्रे आणि संकेतस्थळ विश्लेषण यांविषयी माहिती.",
  alternates: { canonical: "/privacy" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
