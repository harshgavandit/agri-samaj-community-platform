"use client";
import { useLanguage } from "@/components/LanguageContext";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const { language } = useLanguage();
  return (
    <section className="max-w-xl mx-auto p-10 text-center space-y-4">
      <h1 className="text-2xl font-bold">
        {language === "mr"
          ? "पृष्ठ लोड करता आले नाही"
          : "This page could not be loaded"}
      </h1>
      <p>
        {language === "mr" ? "कृपया पुन्हा प्रयत्न करा." : "Please try again."}
      </p>
      <button className="bg-navy-950 text-white rounded-lg p-3" onClick={reset}>
        {language === "mr" ? "पुन्हा प्रयत्न करा" : "Try again"}
      </button>
    </section>
  );
}
