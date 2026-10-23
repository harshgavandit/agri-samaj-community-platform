"use client";
import PackageManager from "@/components/PackageManager";
import Feedback from "@/components/Feedback";
import { apiFetch } from "@/lib/client-api";

import { useLanguage } from "@/components/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminAdvertisementsPage() {
  const { language } = useLanguage();
  const [requestError, setRequestError] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/ads");
      const data = await res.json();
      if (data.bookings) setBookings(data.bookings);
    } catch (e) {
      setRequestError(
        e instanceof Error ? e.message : "Unable to complete the request.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdate = async (
    id: string,
    paymentStatus: string,
    status: string,
  ) => {
    if (saving) return;
    setSaving(true);
    setRequestError("");
    try {
      await apiFetch("/api/admin/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, paymentStatus, status }),
      });
      await fetchBookings();
    } catch (e) {
      setRequestError(
        e instanceof Error ? e.message : "Unable to complete the request.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <Feedback message={requestError} />
      <PackageManager />
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-navy-950"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {language === "mr"
              ? "प्रशासक नियंत्रण कक्षाकडे परत जा"
              : "Back to Admin Dashboard"}
          </span>
        </Link>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
          {language === "mr"
            ? "जाहिरात व प्रायोजकत्व व्यवस्थापन कक्ष"
            : "Advertising & Sponsorship Management"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {language === "mr"
            ? "आगरी उद्योजक डिरेक्टरी व डिजिटल पोर्टलवरील जाहिरात स्लॉट बुकिंग्ज, देयक पडताळणी व प्रूफ मान्यता."
            : "Ad bookings, payment verification, and proof validation for the directory and portal."}
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : bookings.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">
                    {language === "mr" ? "बुकिंग संदर्भ" : "Booking Ref"}
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    {language === "mr"
                      ? "जाहिरातदार व व्यवसाय"
                      : "Advertiser & Business"}
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    {language === "mr" ? "पॅकेज व रक्कम" : "Package & Amount"}
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    {language === "mr"
                      ? "पेमेंट पद्धत व संदर्भ"
                      : "Payment Method & Ref"}
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    {language === "mr" ? "पेमेंट स्थिती" : "Payment Status"}
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    {language === "mr" ? "प्रूफ स्थिती" : "Proof Status"}
                  </th>
                  <th className="px-4 py-3 text-right font-bold">
                    {language === "mr" ? "कृती" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono font-bold text-navy-950">
                      {b.bookingRef}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy-950">
                        {b.businessName}
                      </div>
                      <div className="text-slate-600">
                        {b.advertiserName} ({b.phone})
                      </div>
                      {b.artworkUrl && (
                        <a
                          href={b.artworkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-800 underline text-[11px] font-semibold mt-0.5 block hover:text-amber-950"
                        >
                          {language === "mr" ? "आर्टवर्क पहा" : "View Artwork"}
                        </a>
                      )}
                      {b.adTextContent && (
                        <div className="text-[10px] text-slate-600 line-clamp-1 italic mt-0.5">
                          "{b.adTextContent}"
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        {language === "mr"
                          ? b.package?.nameMr
                          : b.package?.nameEn || b.package?.nameMr}
                      </div>
                      <div className="font-bold text-navy-950">
                        {formatCurrency(b.amount)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{b.paymentMethod}</div>
                      <div className="font-mono text-[10px] text-slate-600">
                        {b.paymentReference ||
                          (language === "mr" ? "प्रलंबित" : "Pending")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          b.paymentStatus === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{b.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      {b.paymentStatus !== "VERIFIED" && (
                        <button
                          disabled={saving}
                          onClick={() =>
                            handleUpdate(b.id, "VERIFIED", b.status)
                          }
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                        >
                          {language === "mr"
                            ? "पेमेंट जमा मानले"
                            : "Mark Verified"}
                        </button>
                      )}
                      {b.status !== "APPROVED" && (
                        <button
                          disabled={saving}
                          onClick={() =>
                            handleUpdate(b.id, b.paymentStatus, "APPROVED")
                          }
                          className="px-2.5 py-1 bg-navy-950 hover:bg-navy-800 text-white rounded text-[10px] font-bold"
                        >
                          {language === "mr" ? "मंजूर" : "Approve"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-600">
          {language === "mr"
            ? "सध्या कोणतीही जाहिरात नोंदणी प्राप्त झालेली नाही."
            : "No advertising bookings received currently."}
        </div>
      )}
    </div>
  );
}
