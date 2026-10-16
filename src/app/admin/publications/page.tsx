"use client";
import Link from "next/link";
import RecordManager from "@/components/RecordManager";
import { useLanguage } from "@/components/LanguageContext";
export default function PublicationsAdmin() {
  const { language } = useLanguage();
  return (
    <div className="max-w-[1400px] mx-auto p-5 space-y-5">
      <Link className="underline" href="/admin">
        {language === "mr" ? "प्रशासक नियंत्रण कक्ष" : "Admin dashboard"}
      </Link>
      <h1 className="text-2xl font-bold">
        {language === "mr" ? "प्रकाशने व्यवस्थापन" : "Publication management"}
      </h1>
      <RecordManager
        endpoint="/api/admin/publications"
        title={language === "mr" ? "डिजिटल ग्रंथालय" : "Digital library"}
        defaults={{
          id: "",
          titleMr: "",
          titleEn: "",
          editionYear: new Date().getFullYear(),
          editionType: "DIRECTORY",
          descriptionMr: "",
          descriptionEn: "",
          pdfUrl: "",
          isPublic: false,
        }}
        fields={[
          { key: "titleMr", mr: "शीर्षक (मराठी)", en: "Title (Marathi)" },
          { key: "titleEn", mr: "शीर्षक (इंग्रजी)", en: "Title (English)" },
          {
            key: "editionYear",
            mr: "वर्ष",
            en: "Edition year",
            type: "number",
          },
          {
            key: "editionType",
            mr: "प्रकार",
            en: "Edition type",
            options: ["DIRECTORY", "MAGAZINE_AGRI_DARPAN", "REPORT", "OTHER"],
          },
          {
            key: "descriptionMr",
            mr: "वर्णन (मराठी)",
            en: "Description (Marathi)",
          },
          {
            key: "descriptionEn",
            mr: "वर्णन (इंग्रजी)",
            en: "Description (English)",
          },
          {
            key: "pdfUrl",
            mr: "सार्वजनिक PDF लिंक",
            en: "Approved public PDF URL",
          },
          {
            key: "isPublic",
            mr: "सार्वजनिक करा",
            en: "Publish publicly",
            type: "checkbox",
          },
        ]}
      />
    </div>
  );
}
