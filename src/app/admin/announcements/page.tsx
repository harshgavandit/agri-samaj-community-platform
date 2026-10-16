"use client";
import Modal from "@/components/Modal";
import Feedback from "@/components/Feedback";
import { apiFetch } from "@/lib/client-api";

import { useLanguage } from "@/components/LanguageContext";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function AdminAnnouncementsPage() {
  const { language } = useLanguage();
  const [requestError, setRequestError] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    titleMr: "",
    titleEn: "",
    slug: "",
    category: "EVENT",
    eventDate: "",
    location: "",
    contentMr: "",
    contentEn: "",
    isPublished: true,
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/announcements");
      const data = await res.json();
      if (data.announcements) setAnnouncements(data.announcements);
    } catch (e) {
      setRequestError(
        e instanceof Error ? e.message : "Unable to complete the request.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    if (saving) return;
    setSaving(true);
    setRequestError("");
    e.preventDefault();
    try {
      const res = await apiFetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchAnnouncements();
      }
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

        <button
          disabled={saving}
          onClick={() => {
            setFormData({
              id: "",
              titleMr: "",
              titleEn: "",
              slug: "",
              category: "EVENT",
              eventDate: "",
              location: "",
              contentMr: "",
              contentEn: "",
              isPublished: true,
            });
            setShowAddModal(true);
          }}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-navy-950 hover:bg-navy-900 text-white rounded-lg text-xs font-bold transition shadow"
        >
          <Plus className="w-4 h-4" />
          <span>
            {language === "mr"
              ? "नवीन घोषणा / कार्यक्रम जोडा"
              : "Add Announcement / Event"}
          </span>
        </button>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
          {language === "mr"
            ? "घोषणा व कार्यक्रम व्यवस्थापन (Announcements & Events)"
            : "Announcements & Events Management"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {language === "mr"
            ? "आगरी उद्योजक परिषदेच्या आगामी बैठका, व्यापार प्रदर्शने, आणि मार्गदर्शक उपक्रमांची प्रसिद्धी व्यवस्थापित करा."
            : "Manage conventions, expos, seminars, and organizational announcements."}
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block w-7 h-7 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : announcements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {a.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      a.isPublished
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {a.isPublished
                      ? language === "mr"
                        ? "प्रसिद्ध (Published)"
                        : "Published"
                      : language === "mr"
                        ? "मसुदा (Draft)"
                        : "Draft"}
                  </span>
                </div>

                <h3 className="font-bold text-base text-navy-950">
                  {language === "mr" ? a.titleMr : a.titleEn || a.titleMr}
                </h3>
                {language === "mr" && a.titleEn && (
                  <p className="text-xs text-slate-600 font-medium">
                    {a.titleEn}
                  </p>
                )}
                {language === "en" && a.titleMr && (
                  <p className="text-xs text-slate-600 font-medium">
                    {a.titleMr}
                  </p>
                )}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {language === "mr" ? a.contentMr : a.contentEn || a.contentMr}
                </p>

                {a.location && (
                  <div className="flex items-center space-x-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{a.location}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {a.eventDate
                    ? formatDate(a.eventDate)
                    : language === "mr"
                      ? "तारीख निश्चित नाही"
                      : "Date TBD"}
                </span>
                <span className="font-mono text-[10px]">{a.slug}</span>
                <button
                  disabled={saving}
                  className="text-amber-800 underline"
                  onClick={() => {
                    setFormData({
                      id: a.id,
                      titleMr: a.titleMr,
                      titleEn: a.titleEn,
                      slug: a.slug,
                      category: a.category,
                      eventDate: a.eventDate ? a.eventDate.slice(0, 10) : "",
                      location: a.location || "",
                      contentMr: a.contentMr,
                      contentEn: a.contentEn,
                      isPublished: a.isPublished,
                    });
                    setShowAddModal(true);
                  }}
                >
                  {language === "mr" ? "संपादन" : "Edit"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-600">
          {language === "mr"
            ? "कोणतीही घोषणा आढळली नाही."
            : "No announcements found."}
        </div>
      )}

      {/* Create Announcement Modal */}
      {showAddModal && (
        <Modal
          title="Announcement editor"
          error={requestError}
          onClose={() => setShowAddModal(false)}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-xs"
          >
            <h3 className="font-bold text-base text-navy-950 border-b pb-2">
              {language === "mr"
                ? "नवीन घोषणा / कार्यक्रम नोंदणी"
                : "Create New Announcement / Event"}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label
                  className="font-bold text-slate-700 block"
                  htmlFor="field-1"
                >
                  {language === "mr" ? "शीर्षक (मराठी)" : "Title (Marathi)"}
                </label>
                <input
                  id="field-1"
                  type="text"
                  value={formData.titleMr}
                  onChange={(e) =>
                    setFormData({ ...formData, titleMr: e.target.value })
                  }
                  placeholder={
                    language === "mr"
                      ? "उदा. आगरी उद्योजक डिजिटल परिषद २०२६"
                      : "e.g. आगरी उद्योजक डिजिटल परिषद २०२६"
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label
                  className="font-bold text-slate-700 block"
                  htmlFor="field-2"
                >
                  {language === "mr" ? "Title (English)" : "Title (English)"}
                </label>
                <input
                  id="field-2"
                  type="text"
                  value={formData.titleEn}
                  onChange={(e) =>
                    setFormData({ ...formData, titleEn: e.target.value })
                  }
                  placeholder="e.g. Agri Entrepreneur Digital Summit 2026"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  className="font-bold text-slate-700 block"
                  htmlFor="field-3"
                >
                  {language === "mr" ? "वर्गवारी (Category)" : "Category"}
                </label>
                <select
                  id="field-3"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="EVENT">
                    {language === "mr" ? "कार्यक्रम (Event)" : "Event"}
                  </option>
                  <option value="INITIATIVE">
                    {language === "mr" ? "उपक्रम (Initiative)" : "Initiative"}
                  </option>
                  <option value="NEWS">
                    {language === "mr" ? "बातम्या (News)" : "News"}
                  </option>
                  <option value="MEETING">
                    {language === "mr" ? "बैठक (Meeting)" : "Meeting"}
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  className="font-bold text-slate-700 block"
                  htmlFor="field-4"
                >
                  {language === "mr" ? "तारीख (Event Date)" : "Event Date"}
                </label>
                <input
                  id="field-4"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) =>
                    setFormData({ ...formData, eventDate: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label
                  className="font-bold text-slate-700 block"
                  htmlFor="field-5"
                >
                  {language === "mr" ? "ठिकाण (Location)" : "Location"}
                </label>
                <input
                  id="field-5"
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder={
                    language === "mr"
                      ? "उदा. पनवेल आगरी समाज मंडळ सभागृह"
                      : "e.g. Panvel Agri Samaj Mandal Hall"
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label
                  className="font-bold text-slate-700 block"
                  htmlFor="field-6"
                >
                  {language === "mr"
                    ? "मजकूर (Content - मराठी)"
                    : "Content (Marathi)"}
                </label>
                <textarea
                  id="field-6"
                  rows={3}
                  value={formData.contentMr}
                  onChange={(e) =>
                    setFormData({ ...formData, contentMr: e.target.value })
                  }
                  placeholder={
                    language === "mr"
                      ? "कार्यक्रमाचा सविस्तर तपशील..."
                      : "Details in Marathi..."
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="announcement-en" className="block font-bold">
                {language === "mr" ? "मजकूर (इंग्रजी)" : "Content (English)"}
              </label>
              <textarea
                id="announcement-en"
                className="w-full p-2 border rounded"
                value={formData.contentEn}
                onChange={(e) =>
                  setFormData({ ...formData, contentEn: e.target.value })
                }
              />
              <label className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublished: e.target.checked })
                  }
                />
                {language === "mr" ? "प्रसिद्ध करा" : "Publish publicly"}
              </label>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button
                disabled={saving}
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded font-semibold text-slate-600"
              >
                {language === "mr" ? "रद्द करा" : "Cancel"}
              </button>
              <button
                disabled={saving}
                type="submit"
                className="px-6 py-2 bg-navy-950 text-white font-bold rounded"
              >
                {language === "mr" ? "प्रसिद्ध करा" : "Publish"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
