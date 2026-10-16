"use client";
import Feedback from "@/components/Feedback";
import { apiFetch } from "@/lib/client-api";

import { useLanguage } from "@/components/LanguageContext";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminInquiriesPage() {
  const { language } = useLanguage();
  const [requestError, setRequestError] = useState("");
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/inquiries");
      const data = await res.json();
      if (data.inquiries) setInquiries(data.inquiries);
    } catch (e) {
      setRequestError(
        e instanceof Error ? e.message : "Unable to complete the request.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    if (saving) return;
    setSaving(true);
    setRequestError("");
    try {
      await apiFetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      fetchInquiries();
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
            ? "संपर्क व विचारणा व्यवस्थापन (Contact Inquiries)"
            : "Contact & Inquiry Management"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {language === "mr"
            ? "वेबसाइटवरील संपर्क फॉर्मद्वारे नागरिकांकडून आणि व्यावसायिकांकडून आलेले संदेश आणि त्यांचे निवारण."
            : "Incoming inquiries from members and businesses through the contact portal."}
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : inquiries.length > 0 ? (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-navy-950">
                      {inq.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        inq.status === "RESOLVED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : inq.status === "IN_PROGRESS"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {inq.status === "RESOLVED"
                        ? language === "mr"
                          ? "निवारण झाले"
                          : "Resolved"
                        : inq.status === "IN_PROGRESS"
                          ? language === "mr"
                            ? "प्रक्रियेत"
                            : "In Progress"
                          : language === "mr"
                            ? "नवीन"
                            : "New"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{inq.email}</span>
                    </span>
                    {inq.phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inq.phone}</span>
                      </span>
                    )}
                    <span>•</span>
                    <span>{formatDate(inq.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {inq.status !== "RESOLVED" && (
                    <button
                      disabled={saving}
                      onClick={() => handleStatusUpdate(inq.id, "RESOLVED")}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      {language === "mr"
                        ? "निवारण झाले (Mark Resolved)"
                        : "Mark Resolved"}
                    </button>
                  )}
                  {inq.status === "NEW" && (
                    <button
                      disabled={saving}
                      onClick={() => handleStatusUpdate(inq.id, "IN_PROGRESS")}
                      className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition"
                    >
                      {language === "mr"
                        ? "प्रक्रियेत (In Progress)"
                        : "In Progress"}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <strong className="text-xs text-navy-950 block mb-1">
                  {language === "mr" ? "विषय:" : "Subject:"} {inq.subject}
                </strong>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {inq.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-600">
          {language === "mr"
            ? "सध्या कोणतीही विचारणा प्रलंबित नाही."
            : "No pending inquiries currently."}
        </div>
      )}
    </div>
  );
}
