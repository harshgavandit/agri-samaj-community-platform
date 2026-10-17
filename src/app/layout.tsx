import Footer from "@/components/Footer";
import { LanguageProvider } from "@/components/LanguageContext";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "आगरी समाज डिजिटल व्यासपीठ | Akhil Aagri Samaj Parishad",
  description:
    "अखिल आगरी समाज परिषद - उद्योजक व विकास मंच. उत्पादन, व्यापार, बांधकाम, आयटी व सेवा क्षेत्रातील आगरी उद्योजकांची अधिकृत डिरेक्टरी.",
  keywords: [
    "Agri Samaj",
    "Agri Udyojak",
    "Akhil Aagri Samaj Parishad",
    "आगरी समाज",
    "आगरी उद्योजक डिरेक्टरी",
    "आगरी दर्पण",
    "Panvel Agri Samaj",
    "Raigad Entrepreneurs",
    "Thane Agri Samaj",
    "Navi Mumbai Agri Entrepreneurs",
  ],
  authors: [{ name: "अखिल आगरी समाज परिषद" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mr">
      <body className="min-h-screen flex flex-col bg-[#FAF8F5] text-navy-950 antialiased selection:bg-amber-200 selection:text-amber-900">
        <LanguageProvider>
          <a href="#main-content" className="skip-link">
            मुख्य मजकुराकडे जा / Skip to content
          </a>
          <Navbar />
          <main id="main-content" tabIndex={-1} className="flex-grow">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
