"use client";
import Feedback from "@/components/Feedback";
import { apiFetch } from "@/lib/client-api";

import { useLanguage } from "@/components/LanguageContext";
import { getLocalizedBusiness } from "@/lib/localize";
import { formatCurrency } from "@/lib/utils";
import {
  Building2,
  CheckCircle2,
  Clock,
  Megaphone,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [requestError, setRequestError] = useState("");

  const [stats, setStats] = useState<any>(null);
  const [pendingBusinesses, setPendingBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function loadAdminData() {
      try {
        const [statsData, busData] = await Promise.all([
          apiFetch("/api/admin/stats", { signal: controller.signal }).then(
            (response) => response.json(),
          ),
          apiFetch("/api/admin/businesses?status=PENDING&limit=5", {
            signal: controller.signal,
          }).then((response) => response.json()),
        ]);
        if (controller.signal.aborted) return;
        if (statsData.stats) setStats(statsData.stats);
        if (busData.businesses) setPendingBusinesses(busData.businesses);
      } catch (err) {
        if (controller.signal.aborted) return;
        setRequestError(
          err instanceof Error
            ? err.message
            : "Unable to complete the request.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAdminData();
    return () => controller.abort();
  }, [router]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <Feedback message={requestError} />
      <Link
        href="/admin/publications"
        className="inline-block px-4 py-2 border rounded-lg text-sm font-semibold"
      >
        {language === "mr" ? "प्रकाशने व्यवस्थापन" : "Manage publications"}
      </Link>
      {/* Top Banner */}
      <div className="bg-navy-950 text-white p-4 sm:p-5 rounded-xl border-b-4 border-amber-500 shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="inline-flex items-center space-x-1.5 text-xs text-amber-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {language === "mr"
                ? "अखिल आगरी समाज परिषद • केंद्रीय प्रशासक व्यवस्थापन कक्ष"
                : "Akhil Agri Samaj Parishad • Central Administrative Bureau"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            {language === "mr"
              ? "प्रशासक नियंत्रण कक्ष (Admin Panel)"
              : "Central Administrative Portal"}
          </h1>
          <p className="text-xs text-slate-300">
            {language === "mr"
              ? "व्यवसाय पडताळणी, जाहिरात मंजुरी, डिरेक्टरी व्यवस्थापन आणि अहवाल."
              : "Review applications, manage directory classifications, approve advertisements, and verify data."}
          </p>
        </div>

        {/* Quick Nav Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/businesses"
            className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition shadow"
          >
            {language === "mr" ? "व्यवसाय पडताळणी" : "Business Verification"}
          </Link>
          <Link
            href="/admin/advertisements"
            className="px-3.5 py-2 bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            {language === "mr" ? "जाहिरात बुकिंग्ज" : "Ad Bookings"}
          </Link>
          <Link
            href="/admin/categories"
            className="px-3.5 py-2 bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            {language === "mr" ? "उद्योग शाखा" : "Categories"}
          </Link>
          <Link
            href="/admin/inquiries"
            className="px-3.5 py-2 bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            {language === "mr" ? "विचारणा संदेश" : "Inquiries"}
          </Link>
          <Link
            href="/admin/announcements"
            className="px-3.5 py-2 bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            {language === "mr" ? "घोषणा व मेळावे" : "Announcements"}
          </Link>
          <Link
            href="/admin/census"
            className="px-3.5 py-2 bg-navy-800 hover:bg-navy-700 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition"
          >
            {language === "mr"
              ? "जनगणना ट्रॅकर (Restricted)"
              : "Census Tracker (Restricted)"}
          </Link>
        </div>
      </div>

      {/* Database Driven Key Metrics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-600 block font-medium">
              {language === "mr" ? "सत्यापित व्यवसाय" : "Verified Businesses"}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-navy-950 flex items-center justify-between">
              <span>{stats.totalApprovedBusinesses}</span>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold block">
              {language === "mr"
                ? "सार्वजनिक डिरेक्टरीमध्ये सक्रिय"
                : "Active in Public Directory"}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-600 block font-medium">
              {language === "mr"
                ? "पडताळणी प्रलंबित अर्ज"
                : "Pending Applications"}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-center justify-between">
              <span>{stats.totalPendingBusinesses}</span>
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <Link
              href="/admin/businesses?status=PENDING"
              className="text-[11px] text-amber-800 font-bold block hover:underline"
            >
              {language === "mr"
                ? "अर्ज तपासा व मंजूर करा →"
                : "Review & Approve →"}
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-600 block font-medium">
              {language === "mr" ? "जाहिरात बुकिंग्ज" : "Ad Bookings"}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-navy-950 flex items-center justify-between">
              <span>{stats.totalAdBookings}</span>
              <Megaphone className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-[11px] text-slate-600 block">
              {language === "mr"
                ? `एकूण महसूल: ${formatCurrency(stats.verifiedRevenue)}`
                : `Verified Revenue: ${formatCurrency(stats.verifiedRevenue)}`}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-600 block font-medium">
              {language === "mr"
                ? "उद्योग शाखा / वर्गवारी"
                : "Industry Sectors"}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-navy-950 flex items-center justify-between">
              <span>{stats.totalCategories}</span>
              <Building2 className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-[11px] text-slate-600 block">
              {language === "mr" ? "सक्रिय वर्गीकरण" : "Active Categories"}
            </span>
          </div>
        </div>
      )}

      {/* Pending Applications Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-950 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>
                {language === "mr"
                  ? "पडताळणीसाठी नवीन आलेले व्यवसाय अर्ज (Pending Review Queue)"
                  : "Pending Application Queue"}
              </span>
            </h2>
            <p className="text-xs text-slate-600">
              {language === "mr"
                ? "प्रत्येक अर्जाची खात्री करून डिरेक्टरीमध्ये सक्रिय करा किंवा आवश्यक सुधारणा सुचवा."
                : "Scrutinize incoming submissions and approve them for directory publishing or request revisions."}
            </p>
          </div>
          <Link
            href="/admin/businesses"
            className="text-xs font-bold text-amber-700 hover:text-amber-800"
          >
            {language === "mr" ? "सर्व अर्ज पहा →" : "View All →"}
          </Link>
        </div>

        {pendingBusinesses.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {pendingBusinesses.map((b) => {
              const loc = getLocalizedBusiness(b, language);
              return (
                <div
                  key={b.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-navy-950">
                        {b.refNumber}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {loc.categoryName}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-navy-950">
                      {loc.businessName}
                    </h3>
                    <div className="text-xs text-slate-600">
                      {language === "mr" ? "उद्योजक:" : "Owner:"}{" "}
                      {loc.ownerName} ({b.ownerPhone}) • {loc.officeCity},{" "}
                      {loc.officeDistrict}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/businesses?id=${b.id}`}
                      className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition"
                    >
                      {language === "mr" ? "पडताळणी करा" : "Verify Application"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-600 bg-slate-50 rounded-xl">
            {language === "mr"
              ? "सध्या कोणताही नवीन अर्ज प्रलंबित नाही. सर्व अर्ज मंजूर झाले आहेत."
              : "No pending applications currently. All submissions have been processed."}
          </div>
        )}
      </div>
    </div>
  );
}
