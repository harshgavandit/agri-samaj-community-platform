"use client";
import Feedback from "@/components/Feedback";
import BusinessCard from "@/components/BusinessCard";
import { useBusinessShortlist } from "@/components/useBusinessShortlist";

import { useLanguage } from "@/components/LanguageContext";
import { getLocalizedBusiness } from "@/lib/localize";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Bookmark,
  CheckCircle2,
  Clock,
  Edit,
  ExternalLink,
  Megaphone,
  PlusCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [requestError, setRequestError] = useState("");

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const shortlist = useBusinessShortlist(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/dashboard/my-businesses", { signal: controller.signal })
      .then((r) => {
        if (r.status === 401) {
          router.replace("/login?returnTo=%2Fdashboard");
          return null;
        }
        if (!r.ok)
          throw new Error(
            "Unable to load your dashboard. Please refresh and try again.",
          );
        return r.json();
      })
      .then((data) => {
        if (data && !controller.signal.aborted) {
          if (data.businesses) setBusinesses(data.businesses);
          if (data.ads) setAds(data.ads);
        }
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) setRequestError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center space-x-1 text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === "mr" ? "मान्यताप्राप्त" : "Approved"}</span>
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center space-x-1 text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {language === "mr" ? "पडताळणी प्रलंबित" : "Pending Review"}
            </span>
          </span>
        );
      case "REVISION_REQUIRED":
        return (
          <span className="inline-flex items-center space-x-1 text-orange-800 bg-orange-50 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-orange-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              {language === "mr" ? "सुधारणा आवश्यक" : "Revision Required"}
            </span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center space-x-1 text-red-800 bg-red-50 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>{language === "mr" ? "नामंजूर" : "Rejected"}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <span>{language === "mr" ? "मसुदा" : "Draft"}</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div
        className="py-24 text-center"
        role="status"
        aria-label={
          language === "mr" ? "डॅशबोर्ड लोड होत आहे" : "Loading your dashboard"
        }
      >
        <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Feedback message={requestError} />
      {/* Top Banner */}
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>
            {language === "mr" ? "आपले सदस्य खाते" : "Your member space"}
          </p>
          <h1 className={styles.title}>
            {language === "mr"
              ? "आपला समुदाय डॅशबोर्ड"
              : "Your community dashboard"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {language === "mr"
              ? "आपल्या आवडत्या व्यवसायांची यादी, नोंदणी अर्ज आणि जाहिरात बुकिंग एकाच ठिकाणी."
              : "Your saved contacts, business applications and advertisement bookings, together in one place."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/register-business"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs sm:text-sm font-bold transition shadow"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.ctaRegisterBusiness}</span>
          </Link>
          <Link
            href="/advertise"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-navy-950 hover:bg-navy-900 text-white rounded-lg text-xs sm:text-sm font-bold transition shadow"
          >
            <Megaphone className="w-4 h-4" />
            <span>{t.ctaAdvertiseNow}</span>
          </Link>
        </div>
      </div>

      <div
        className={styles.stats}
        aria-label={language === "mr" ? "खात्याचा आढावा" : "Account overview"}
      >
        <a href="#saved-businesses">
          <Bookmark size={19} aria-hidden="true" />
          <strong>{shortlist.loading ? "…" : shortlist.savedIds.size}</strong>
          <span>
            {language === "mr" ? "जतन केलेले व्यवसाय" : "Saved businesses"}
          </span>
        </a>
        <a href="#my-businesses">
          <Building2 size={19} aria-hidden="true" />
          <strong>{businesses.length}</strong>
          <span>
            {language === "mr" ? "व्यवसाय नोंदणी" : "Business applications"}
          </span>
        </a>
        <a href="#my-advertisements">
          <Megaphone size={19} aria-hidden="true" />
          <strong>{ads.length}</strong>
          <span>
            {language === "mr" ? "जाहिरात बुकिंग" : "Advertisement bookings"}
          </span>
        </a>
      </div>

      <section
        id="saved-businesses"
        className={styles.section}
        aria-labelledby="saved-businesses-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="saved-businesses-title">
              <Bookmark size={20} aria-hidden="true" />
              {language === "mr" ? "जतन केलेले व्यवसाय" : "Saved businesses"}
            </h2>
            <p>
              {language === "mr"
                ? "आपली खासगी यादी. सार्वजनिक डिरेक्टरीत असलेले व्यवसाय येथे दिसतात."
                : "Your private shortlist. Only listings currently available in the public directory appear here."}
            </p>
          </div>
          <Link href="/directory">
            {language === "mr" ? "व्यवसाय शोधा" : "Explore the directory"}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <Feedback message={shortlist.error} />
        {shortlist.error && (
          <button
            type="button"
            className="text-sm font-semibold underline text-emerald-900 min-h-10"
            onClick={shortlist.retry}
          >
            {language === "mr"
              ? "यादी पुन्हा लोड करा"
              : "Reload saved businesses"}
          </button>
        )}
        {shortlist.unavailableCount > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4 text-sm text-amber-950">
            <p>
              {language === "mr"
                ? `${shortlist.unavailableCount} जतन केलेले व्यवसाय सध्या सार्वजनिक डिरेक्टरीत नाहीत. आपल्या यादीत जागा करण्यासाठी त्या नोंदी काढू शकता.`
                : `${shortlist.unavailableCount} saved listings are no longer in the public directory. Remove these saved references to free space in your shortlist.`}
            </p>
            <button
              type="button"
              disabled={shortlist.clearingUnavailable}
              onClick={shortlist.removeUnavailable}
              className="font-semibold underline min-h-10 disabled:opacity-50"
            >
              {language === "mr"
                ? "अनुपलब्ध जतन नोंदी काढा"
                : "Remove unavailable saved listings"}
            </button>
          </div>
        )}
        {shortlist.loading ? (
          <p className={styles.empty} role="status">
            {language === "mr"
              ? "आपली यादी लोड होत आहे…"
              : "Loading your saved businesses…"}
          </p>
        ) : shortlist.businesses.length ? (
          <div className={styles.savedGrid}>
            {shortlist.businesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                saved={shortlist.savedIds.has(business.id)}
                savePending={shortlist.pendingIds.has(business.id)}
                onSave={shortlist.toggle}
              />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <Bookmark size={28} aria-hidden="true" />
            <h3>
              {language === "mr"
                ? "उपयुक्त संपर्क जतन करा"
                : "Keep useful contacts close"}
            </h3>
            <p>
              {language === "mr"
                ? "डिरेक्टरीतील व्यवसायावरील जतन बटण वापरा. आपली यादी येथे दिसेल."
                : "Use the bookmark on any directory listing to save it here for your next project or visit."}
            </p>
            <Link href="/directory">
              {language === "mr" ? "व्यवसाय शोधा" : "Find a business"}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      {/* Section 1: My Registered Businesses */}
      <div id="my-businesses" className="space-y-3 scroll-mt-28">
        <h2 className="text-lg font-bold text-navy-950 flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-amber-600" />
          <span>
            {language === "mr"
              ? "माझे व्यवसाय नोंदणी अर्ज"
              : "My Registered Businesses"}
          </span>
        </h2>

        {businesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {businesses.map((b) => {
              const loc = getLocalizedBusiness(b, language);
              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-600 font-semibold">
                        {loc.refNumber}
                      </span>
                      {getStatusBadge(b.status)}
                    </div>

                    <h3 className="text-lg font-bold text-navy-950">
                      {loc.businessName}
                    </h3>

                    {loc.brandName && (
                      <p className="text-xs text-amber-700 font-medium">
                        {loc.brandLabel} {loc.brandName}
                      </p>
                    )}

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {loc.productsServices}
                    </p>

                    <div className="pt-2 text-xs text-slate-600">
                      {loc.locationString}
                    </div>

                    {b.rejectionReason && (
                      <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                        <strong>
                          {language === "mr"
                            ? "प्रशासकीय शेरा:"
                            : "Admin Note:"}
                        </strong>{" "}
                        {b.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {language === "mr" ? "नोंदणी:" : "Registered:"}{" "}
                      {formatDate(b.createdAt)}
                    </span>
                    <div className="flex items-center space-x-3">
                      {b.status === "APPROVED" ? (
                        <>
                          <Link
                            href={`/directory/${b.id}`}
                            className="font-bold text-amber-700 hover:text-amber-900 inline-flex items-center space-x-1"
                          >
                            <span>
                              {language === "mr"
                                ? "प्रोफाइल पहा"
                                : "View Profile"}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/register-business?id=${b.id}`}
                            className="text-slate-600 hover:text-navy-950 inline-flex items-center space-x-1 font-semibold"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>
                              {language === "mr" ? "संपादित करा" : "Edit"}
                            </span>
                          </Link>
                        </>
                      ) : b.status === "DRAFT" ||
                        b.status === "REVISION_REQUIRED" ? (
                        <Link
                          href={`/register-business?id=${b.id}`}
                          className="font-bold text-amber-700 hover:text-amber-900 inline-flex items-center space-x-1 bg-amber-50 px-2.5 py-1 rounded border border-amber-200"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>
                            {b.status === "REVISION_REQUIRED"
                              ? language === "mr"
                                ? "दुरुस्ती करा"
                                : "Fix & Resubmit"
                              : language === "mr"
                                ? "मसुदा पूर्ण करा"
                                : "Resume Draft"}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-slate-600">
                          {language === "mr"
                            ? "पडताळणी प्रक्रियेत आहे"
                            : "Under Review"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-600">
              {language === "mr"
                ? "आपण अद्याप कोणताही व्यवसाय नोंदणी केलेला नाही."
                : "You have not registered any business profiles yet."}
            </p>
            <Link
              href="/register-business"
              className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 hover:text-amber-800"
            >
              <span>{t.ctaRegisterBusiness}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Section 2: My Ad Bookings */}
      <div id="my-advertisements" className="space-y-4 scroll-mt-28">
        <h2 className="text-xl font-bold text-navy-950 flex items-center space-x-2">
          <Megaphone className="w-5 h-5 text-amber-600" />
          <span>
            {language === "mr"
              ? "माझ्या जाहिरात नोंदणी (Ad Bookings)"
              : "My Advertisement Bookings"}
          </span>
        </h2>

        {ads.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">
                    संदर्भ क्र. (Booking Ref)
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    पॅकेज (Package)
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    रक्कम (Amount)
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    पेमेंट स्थिती (Payment)
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    मंजुरी स्थिती (Status)
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    दिनांक (Date)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono font-bold text-navy-950">
                      {ad.bookingRef}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {language === "mr"
                        ? ad.package?.nameMr
                        : ad.package?.nameEn}
                    </td>
                    <td className="px-4 py-3 font-bold text-navy-950">
                      {formatCurrency(ad.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${
                          ad.paymentStatus === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {ad.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-700">
                        {ad.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(ad.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-600">
            {language === "mr"
              ? "कोणतीही जाहिरात नोंदणी आढळली नाही."
              : "No active advertisement bookings."}
          </div>
        )}
      </div>
    </div>
  );
}
