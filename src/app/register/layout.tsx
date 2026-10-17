import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "खाते तयार करा | Create an Account | Aagri Samaj",
  description: "व्यवसाय नोंदणी आणि स्वतःच्या अर्जांसाठी खाते तयार करा.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
