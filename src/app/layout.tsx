import Footer from "@/components/Footer";
import AssistantLauncher from "@/components/AssistantLauncher";
import { LanguageProvider } from "@/components/LanguageContext";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { siteOrigin } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  alternates: { canonical: "/" },
  title: "आगरी समाज | संस्कृती, उद्योजकता आणि नव्या संधी | Aagri Samaj",
  description:
    "आगरी समाजाची संस्कृती, प्रशासक-मंजूर उद्योजक डिरेक्टरी, शिक्षण व करिअरची अधिकृत साधने आणि प्रकाशित समुदाय घडामोडी.",
  openGraph: {
    type: "website",
    siteName: "Aagri Samaj Community Platform",
    locale: "mr_IN",
    alternateLocale: "en_IN",
    title: "आगरी समाज · Aagri Samaj",
    description:
      "Heritage, enterprise and trusted resources for our community.",
  },
  twitter: {
    card: "summary",
    title: "आगरी समाज · Aagri Samaj",
    description:
      "Heritage, enterprise and trusted resources for our community.",
  },
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mr">
      <body className="min-h-screen flex flex-col bg-[#FAF8F5] text-navy-950 antialiased selection:bg-amber-200 selection:text-amber-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Aagri Samaj Community Platform",
              alternateName: "आगरी समाज",
              url: siteOrigin(),
              inLanguage: ["mr-IN", "en-IN"],
              description:
                "Community information, local business discovery, publications and public resources in Marathi and English.",
            }).replaceAll("<", "\\u003c"),
          }}
        />
        <LanguageProvider>
          <a href="#main-content" className="skip-link">
            मुख्य मजकुराकडे जा / Skip to content
          </a>
          <Navbar />
          <main id="main-content" tabIndex={-1} className="flex-grow">
            {children}
          </main>
          <Footer />
          <AssistantLauncher />
        </LanguageProvider>
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  );
}
