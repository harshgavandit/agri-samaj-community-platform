"use client";
import Feedback from "@/components/Feedback";
import { apiFetch } from "@/lib/client-api";

import { useLanguage } from "@/components/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, CreditCard, Megaphone, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdvertisePage() {
  const { language, t } = useLanguage();
  const [requestError, setRequestError] = useState("");
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/advertisements/packages")
      .then((r) => r.json())
      .then((data) => {
        if (data.packages) setPackages(data.packages);
      })
      .catch((error: Error) => setRequestError(error.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Feedback message={requestError} />
      {!loading && !requestError && packages.length === 0 && (
        <p
          role="status"
          className="p-6 bg-white border rounded-xl text-slate-600"
        >
          {language === "mr"
            ? "सध्या नोंदी उपलब्ध नाहीत. अधिक माहितीसाठी कार्यालयाशी संपर्क साधा."
            : "No records are available yet. Contact the office for more information."}
        </p>
      )}
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white p-5 sm:p-7 rounded-2xl border-b-4 border-amber-500 shadow-sm space-y-2">
        <div className="inline-flex items-center space-x-1.5 text-xs text-amber-400 font-semibold bg-navy-800/80 px-2.5 py-0.5 rounded-full border border-amber-500/40">
          <Megaphone className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {language === "mr"
              ? "अखिल आगरी समाज परिषद • उद्योजक विभाग"
              : "Akhil Aagri Samaj Parishad • Entrepreneur Wing"}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">
          {t.adsRateCardTitle}
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
          {t.adsRateCardSubtitle} -{" "}
          {language === "mr"
            ? 'आगरी उद्योजक डिजिटल व्यासपीठ, आगामी छापील आवृत्ती आणि "आगरी दर्पण" द्वारे ५०००+ व्यावसायिक व संस्थांपर्यंत पोहोच.'
            : "Gain prime exposure across digital directories, community publications, and the upcoming print directory."}
        </p>
      </div>

      {/* Historical Context & Rate Clarification */}
      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs sm:text-sm text-amber-950 flex items-start space-x-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong>
            {language === "mr"
              ? "महत्त्वाची प्रशासकीय नोंद:"
              : "Official Administrative Notice:"}
          </strong>
          <p className="leading-relaxed text-xs">
            {language === "mr"
              ? "२००६ व २०१२ च्या छापील पुस्तिकेतील दर ऐतिहासिक संदर्भ म्हणून जतन केले असून खालील दर हे चालू डिजिटल व आगामी आवृत्तीसाठी प्रशासकीय मान्यताप्राप्त सुधारित दर आहेत."
              : "Rates printed in the historical 2012 documents serve as heritage references. The current packages listed below represent approved rates for the digital network and forthcoming editions."}
          </p>
        </div>
      </div>

      {/* Advertisement Packages Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-navy-950">
              {language === "mr"
                ? "उपलब्ध जाहिरात पॅकेजेस"
                : "Available Advertisement Packages"}
            </h2>
            <p className="text-xs text-slate-600">
              {language === "mr"
                ? "आपल्या व्यवसायानुसार योग्य स्लॉट निवडा"
                : "Select the package best suited for your brand"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block w-7 h-7 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-amber-400 transition group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold">
                      {pkg.code}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      {pkg.colorType === "COLOR"
                        ? language === "mr"
                          ? "बहुरंगी (Color)"
                          : "Full Color"
                        : language === "mr"
                          ? "कृष्णधवल (B&W)"
                          : "Black & White"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-navy-950 group-hover:text-amber-800 transition">
                    {language === "mr" ? pkg.nameMr : pkg.nameEn}
                  </h3>

                  <div className="text-2xl font-extrabold text-navy-950">
                    {formatCurrency(pkg.price)}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div>
                      <strong>
                        {language === "mr"
                          ? "आकार / डायमेन्शन:"
                          : "Dimensions / Placement:"}
                      </strong>{" "}
                      {pkg.dimensions}
                    </div>
                    <p className="pt-2 text-slate-600 leading-relaxed">
                      {language === "mr"
                        ? pkg.descriptionMr
                        : pkg.descriptionEn}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    href={`/advertise/book?package=${pkg.id}`}
                    className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-navy-950 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <span>{t.bookThisAd}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Information Box from PDF Page 1 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-bold text-navy-950 flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-amber-600" />
          <span>
            {language === "mr"
              ? "देयक / पेमेंट तपशील व नियम"
              : "Payment Details & Guidelines"}
          </span>
        </h3>

        <div className="text-xs sm:text-sm text-slate-600 space-y-2 leading-relaxed">
          <p>{t.offlinePaymentNote}</p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <strong className="text-navy-950 block">
                {language === "mr" ? "खात्याचे नाव:" : "Account Name:"}
              </strong>
              {language === "mr"
                ? "अखिल आगरी समाज परिषद (उद्योजक विभाग)"
                : "Akhil Aagri Samaj Parishad (Entrepreneur Wing)"}
            </div>
            <div>
              <strong className="text-navy-950 block">
                {language === "mr"
                  ? "स्वीकार्य पेमेंट पद्धती:"
                  : "Accepted Payment Modes:"}
              </strong>
              {language === "mr"
                ? "NEFT / RTGS, चेक / डिमांड ड्राफ्ट (DD), UPI क्यूआर कोड"
                : "NEFT / RTGS, Cheque / Demand Draft, UPI QR Code"}
            </div>
          </div>
          <p className="text-[11px] text-slate-600 pt-2">
            {language === "mr"
              ? "* जाहिरात नोंदणीनंतर कच्चा मजकूर (Ad Copy) किंवा आर्टवर्क आमच्या डिझायनिंग विभागामार्फत तपासून अंतिम छपाईपूर्वी आपल्याला दाखविले जाईल."
              : "* Following ad registration, raw ad copy and artwork will be reviewed by our design team and shared for approval prior to final print."}
          </p>
        </div>
      </div>
    </div>
  );
}
