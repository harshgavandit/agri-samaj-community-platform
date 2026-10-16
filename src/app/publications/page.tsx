"use client";
import Feedback from "@/components/Feedback";
import { apiFetch } from "@/lib/client-api";

import { useLanguage } from "@/components/LanguageContext";
import {
  BookOpen,
  Calendar,
  Download,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function PublicationsPage() {
  const { language, t } = useLanguage();
  const [requestError, setRequestError] = useState("");
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/publications")
      .then((r) => r.json())
      .then((data) => {
        if (data.publications) setPublications(data.publications);
      })
      .catch((error: Error) => setRequestError(error.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <Feedback message={requestError} />
      {/* Page Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
        <div className="inline-flex items-center space-x-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded">
          <BookOpen className="w-3.5 h-3.5" />
          <span>
            {language === "mr"
              ? "अखिल आगरी समाज परिषद • डिजिटल ग्रंथालय"
              : "Akhil Aagri Samaj Parishad • Digital Library & Archives"}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
          {t.publicationsTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
          {t.publicationsSubtitle} -{" "}
          {language === "mr"
            ? "ऐतिहासिक २००६ व २०१२ उद्योजक डिरेक्टरीचे डिजिटाईज्ड संदर्भ ग्रंथ आणि परिषदेचे मासिक मुखपत्र."
            : "Digitized archives of the historic 2006 and 2012 entrepreneur directories and monthly journals."}
        </p>
      </div>

      {!loading && !requestError && publications.length === 0 && (
        <p
          role="status"
          className="p-6 bg-white border rounded-xl text-slate-600"
        >
          {language === "mr"
            ? "सध्या नोंदी उपलब्ध नाहीत. अधिक माहितीसाठी कार्यालयाशी संपर्क साधा."
            : "No records are available yet. Contact the office for more information."}
        </p>
      )}
      {/* Publications Grid */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block w-7 h-7 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {publications.map((pub) => (
            <div
              key={pub.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full font-semibold">
                    {pub.editionType === "DIRECTORY"
                      ? language === "mr"
                        ? "उद्योजक डिरेक्टरी"
                        : "Business Directory"
                      : language === "mr"
                        ? "मासिक मुखपत्र (Agri Darpan)"
                        : "Monthly Journal (Agri Darpan)"}
                  </span>
                  <span className="font-mono font-bold text-slate-600 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {language === "mr"
                        ? `वर्ष ${pub.editionYear}`
                        : `Edition ${pub.editionYear}`}
                    </span>
                  </span>
                </div>

                <h3 className="text-xl font-bold text-navy-950 leading-snug">
                  {language === "mr" ? pub.titleMr : pub.titleEn}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === "mr" ? pub.descriptionMr : pub.descriptionEn}
                </p>

                <div className="pt-2 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <div>
                    <strong>
                      {language === "mr" ? "प्रकाशक:" : "Publisher:"}
                    </strong>{" "}
                    {language === "mr"
                      ? "अखिल आगरी समाज परिषद (उद्योजक विभाग)"
                      : "Akhil Aagri Samaj Parishad (Entrepreneur Wing)"}
                  </div>
                  <div>
                    <strong>
                      {language === "mr" ? "मुख्यालय:" : "Headquarters:"}
                    </strong>{" "}
                    {language === "mr"
                      ? "पनवेल - उरण आगरी समाज मंडळ इमारत"
                      : "Panvel - Uran Agri Samaj Mandal Bhavan"}
                  </div>
                </div>
              </div>

              {pub.pdfUrl ? (
                <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between mt-4">
                  <a
                    href={pub.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-navy-950 hover:bg-amber-600 px-4 py-2 rounded-lg transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>
                      {language === "mr"
                        ? "ऐतिहासिक दस्तऐवज पहा"
                        : "View Historical Scan"}
                    </span>
                  </a>

                  <a
                    href={pub.pdfUrl}
                    download
                    className="p-2 text-slate-600 hover:text-navy-950 hover:bg-slate-100 rounded-lg transition"
                    title={t.ctaDownloadPdf}
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <p className="px-5 pb-5 text-sm text-slate-600">
                  {language === "mr"
                    ? "डिजिटल प्रत उपलब्ध नाही. कार्यालयाशी संपर्क साधा."
                    : "Digital copy unavailable. Contact the office."}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Historical Archival Guidelines */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-600">
        <h4 className="font-bold text-navy-950 flex items-center space-x-1.5 text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            {language === "mr"
              ? "अभिलेखागार व गोपनीयता नियमावली"
              : "Archival & Privacy Standards"}
          </span>
        </h4>
        <p className="leading-relaxed">
          {language === "mr"
            ? "ऐतिहासिक प्रकाशने डिजिटल स्वरूपात जतन करताना तत्कालीन व्यक्तींच्या गोपनीयतेचा आदर राखण्यात आला आहे. समाजातील नवउद्योजकांना प्रेरणा आणि संदर्भ मिळावा हाच या संग्रहाचा मुख्य हेतू आहे."
            : "In digitizing historical archives, personal data privacy and ethical archival guidelines are strictly preserved to serve educational and inspirational reference for modern entrepreneurs."}
        </p>
      </div>
    </div>
  );
}
