import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "लॉगिन | Sign In | Aagri Samaj",
  description: "आपल्या समुदाय खात्यात सुरक्षित प्रवेश करा.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
