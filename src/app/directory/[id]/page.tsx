"use client";
import Feedback from "@/components/Feedback";
import { apiFetch } from "@/lib/client-api";

import { useLanguage } from "@/components/LanguageContext";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Factory,
  Globe,
  GraduationCap,
  Layers,
  MapPin,
  Phone,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getLocalizedBusiness } from "@/lib/localize";

export default function BusinessDetailPage() {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const [requestError, setRequestError] = useState("");

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      try {
        const res = await apiFetch(`/api/businesses/${id}`);
        const data = await res.json();
        if (data.business) {
          setBusiness(data.business);
        } else {
          setError(data.error || "Business profile not found");
        }
      } catch {
        setError("Failed to fetch details");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadDetail();
    }
  }, [id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setRequestError(
        language === "mr"
          ? "लिंक कॉपी करता आली नाही."
          : "Unable to copy the link. Please copy the address from your browser.",
      );
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-600 mt-2">
          {language === "mr"
            ? "माहिती लोड होत आहे..."
            : "Loading business details..."}
        </p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
          {error}
        </div>
        <Link
          href="/directory"
          className="inline-flex items-center space-x-2 text-sm text-amber-700 hover:text-amber-800 font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {language === "mr" ? "डिरेक्टरीकडे परत जा" : "Back to Directory"}
          </span>
        </Link>
      </div>
    );
  }

  const loc = getLocalizedBusiness(business, language);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <Feedback message={requestError} />
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/directory"
          className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-navy-950 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {language === "mr" ? "उद्योजक डिरेक्टरी" : "Back to Directory"}
          </span>
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>
            {copied
              ? language === "mr"
                ? "लिंक कॉपी झाली!"
                : "Copied!"
              : language === "mr"
                ? "शेअर करा"
                : "Share"}
          </span>
        </button>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                {loc.categoryName}
              </span>

              {loc.isVerified && (
                <span className="inline-flex items-center space-x-1 text-emerald-700 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.verifiedBadge}</span>
                </span>
              )}

              <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {loc.refNumber}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              {loc.businessName}
            </h1>

            {loc.brandName && (
              <p className="text-base text-amber-700 font-semibold">
                {loc.brandLabel} {loc.brandName}
              </p>
            )}

            <p className="text-sm text-slate-600">
              {language === "mr"
                ? "संस्थापक / उद्योजक:"
                : "Proprietor / Entrepreneur:"}{" "}
              <strong className="text-navy-950">{loc.ownerName}</strong>
            </p>
          </div>

          {/* Quick Contact Box */}
          <div className="shrink-0 flex flex-col gap-2 sm:items-end">
            {loc.phone && (
              <a
                href={`tel:${loc.phone}`}
                className="inline-flex items-center justify-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-sm w-full sm:w-auto"
              >
                <Phone className="w-4 h-4" />
                <span>{loc.phone}</span>
              </a>
            )}
            {loc.website && (
              <a
                href={loc.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center space-x-1.5 text-xs text-amber-700 hover:text-amber-900 font-semibold px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50/50"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>
                  {language === "mr" ? "संकेतस्थळ पहा" : "Visit Website"}
                </span>
              </a>
            )}
          </div>
        </div>

        {/* Products and Services Highlight */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-5 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-amber-700" />
            <span>
              {language === "mr"
                ? "उत्पादने व सेवांचा तपशील"
                : "Products & Services"}
            </span>
          </h2>
          <p className="text-sm text-slate-800 leading-relaxed font-medium">
            {loc.productsServices}
          </p>
          {loc.subCategory && (
            <p className="text-xs text-amber-800">
              <strong>
                {language === "mr" ? "विशेष कौशल्य:" : "Specialization:"}
              </strong>{" "}
              {loc.subCategory}
            </p>
          )}
        </div>

        {/* Detailed Business Description */}
        {loc.description && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider text-slate-400">
              {language === "mr"
                ? "व्यवसायाची सविस्तर माहिती"
                : "Company Overview"}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {loc.description}
            </p>
          </div>
        )}

        {/* Two-Column Grid: Address & Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          {/* Office Address */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-navy-950 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>
                {language === "mr" ? "कार्यालयाचा पत्ता" : "Registered Office"}
              </span>
            </h3>
            <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
              <p>
                {business.isAddressPublic
                  ? loc.officeAddress
                  : language === "mr"
                    ? "अचूक पत्ता खाजगी आहे. व्यवसायाशी थेट संपर्क साधा."
                    : "The exact address is private. Contact the business directly."}
              </p>
              <p>
                <strong>{loc.officeCity}</strong>,{" "}
                {language === "mr" ? "तालुका:" : "Taluka:"} {loc.officeTaluka},{" "}
                {language === "mr" ? "जिल्हा:" : "District:"}{" "}
                {loc.officeDistrict}
              </p>
              {business.officePincode && (
                <p>
                  {language === "mr" ? "पिन कोड:" : "Pincode:"}{" "}
                  {business.officePincode}
                </p>
              )}
              {business.officePhone && (
                <p>
                  {language === "mr"
                    ? "कार्यालय दूरध्वनी:"
                    : "Office Landline:"}{" "}
                  {business.officePhone}
                </p>
              )}
            </div>

            {business.factoryAddress && (
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-1 text-xs text-slate-600">
                <h4 className="font-bold text-navy-950 flex items-center space-x-1.5">
                  <Factory className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {language === "mr"
                      ? "कारखाना / गोडाऊन / साईट"
                      : "Factory / Workshop / Site"}
                  </span>
                </h4>
                <p>{business.factoryAddress}</p>
                <p>
                  {business.factoryCity}, {business.factoryTaluka},{" "}
                  {business.factoryDistrict} - {business.factoryPincode}
                </p>
              </div>
            )}
          </div>

          {/* Operational Metrics */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-navy-950 flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-amber-600" />
              <span>
                {language === "mr"
                  ? "उद्योग व्याप्ती व स्वरूप"
                  : "Operational Scope"}
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase">
                  {language === "mr" ? "उद्योग प्रकार" : "Classification"}
                </span>
                <span className="font-semibold text-navy-950">
                  {loc.classificationLabel}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase">
                  {language === "mr" ? "मालकी" : "Ownership"}
                </span>
                <span className="font-semibold text-navy-950">
                  {loc.ownershipLabel}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase">
                  {language === "mr" ? "स्थापना वर्ष" : "Established"}
                </span>
                <span className="font-semibold text-navy-950">
                  {business.establishedYear || "-"}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase">
                  {language === "mr" ? "कामाचे स्वरूप" : "Work Nature"}
                </span>
                <span className="font-semibold text-navy-950">
                  {loc.workNatureLabel}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase">
                  {language === "mr" ? "जागेची मालकी" : "Premises"}
                </span>
                <span className="font-semibold text-navy-950">
                  {loc.premisesLabel}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase">
                  {language === "mr" ? "एकूण कर्मचारी" : "Employees"}
                </span>
                <span className="font-semibold text-navy-950">
                  {business.employeeCountTotal || "-"}
                </span>
              </div>
            </div>

            {/* Educational credentials if available */}
            {(business.ownerEducationSchool ||
              business.ownerEducationVocational) && (
              <div className="pt-2 text-xs text-slate-600 flex items-start space-x-1.5">
                <GraduationCap className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>
                    {language === "mr" ? "शिक्षण:" : "Education:"}
                  </strong>{" "}
                  {[
                    business.ownerEducationSchool,
                    business.ownerEducationVocational,
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification Footer Note */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            {loc.isVerified
              ? language === "mr"
                ? "या व्यासपीठाच्या प्रशासकांनी मंजूर केलेली नोंद."
                : "This listing was approved by the platform administrator."
              : language === "mr"
                ? "अर्ज पडताळणी अंतर्गत आहे."
                : "This application is under review."}
          </span>
          <span className="font-mono text-slate-400">{loc.refNumber}</span>
        </div>
      </div>
    </div>
  );
}
