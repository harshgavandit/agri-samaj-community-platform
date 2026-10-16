"use client";
import Modal from "@/components/Modal";
import Feedback from "@/components/Feedback";
import { apiFetch } from "@/lib/client-api";

import { useLanguage } from "@/components/LanguageContext";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function AdminCategoriesPage() {
  const { language } = useLanguage();
  const [requestError, setRequestError] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    slug: "",
    nameMr: "",
    nameEn: "",
    descriptionMr: "",
    descriptionEn: "",
    icon: "Building",
    order: "0",
    isActive: true,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/categories");
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (e) {
      setRequestError(
        e instanceof Error ? e.message : "Unable to complete the request.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEdit = (cat: any) => {
    setEditingCat(cat);
    setFormData({
      id: cat.id,
      slug: cat.slug,
      nameMr: cat.nameMr,
      nameEn: cat.nameEn,
      descriptionMr: cat.descriptionMr || "",
      descriptionEn: cat.descriptionEn || "",
      icon: cat.icon || "Building",
      order: cat.order.toString(),
      isActive: cat.isActive,
    });
    setShowAddModal(true);
  };

  const handleCreateNew = () => {
    setEditingCat(null);
    setFormData({
      id: "",
      slug: "",
      nameMr: "",
      nameEn: "",
      descriptionMr: "",
      descriptionEn: "",
      icon: "Building",
      order: (categories.length + 1).toString(),
      isActive: true,
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (saving) return;
    setSaving(true);
    setRequestError("");
    e.preventDefault();
    try {
      const res = await apiFetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchCategories();
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
          onClick={handleCreateNew}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-navy-950 hover:bg-navy-900 text-white rounded-lg text-xs font-bold transition shadow"
        >
          <Plus className="w-4 h-4" />
          <span>
            {language === "mr"
              ? "नवीन उद्योग शाखा जोडा (Add Category)"
              : "Add New Category"}
          </span>
        </button>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
          {language === "mr"
            ? "उद्योग व व्यावसायिक शाखा व्यवस्थापन (Categories)"
            : "Industry & Category Management"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {language === "mr"
            ? "आगरी उद्योजक डिरेक्टरीतील व्यावसायिक वर्गीकरण, क्रम आणि मराठी/इंग्रजी नावे व्यवस्थापित करा."
            : "Manage sector classifications, display ordering, and Marathi/English nomenclature."}
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-bold">
                  {language === "mr" ? "क्रम" : "Order"}
                </th>
                <th className="px-4 py-3 text-left font-bold">
                  {language === "mr" ? "शाखा नाव (मराठी)" : "Name (Marathi)"}
                </th>
                <th className="px-4 py-3 text-left font-bold">
                  {language === "mr" ? "Name (English)" : "Name (English)"}
                </th>
                <th className="px-4 py-3 text-left font-bold">
                  {language === "mr" ? "Slug / URL" : "Slug / URL"}
                </th>
                <th className="px-4 py-3 text-left font-bold">
                  {language === "mr" ? "उद्योजक संख्या" : "Enterprises"}
                </th>
                <th className="px-4 py-3 text-left font-bold">
                  {language === "mr" ? "स्थिती" : "Status"}
                </th>
                <th className="px-4 py-3 text-right font-bold">
                  {language === "mr" ? "कृती" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-mono font-bold">{c.order}</td>
                  <td className="px-4 py-3 font-semibold text-navy-950">
                    {c.nameMr}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{c.nameEn}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {c.slug}
                  </td>
                  <td className="px-4 py-3 font-bold text-amber-800">
                    {c._count?.businesses || 0}{" "}
                    {language === "mr" ? "उद्योजक" : "Enterprises"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {c.isActive
                        ? language === "mr"
                          ? "सक्रिय (Active)"
                          : "Active"
                        : language === "mr"
                          ? "निष्क्रिय"
                          : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={saving}
                      onClick={() => handleEdit(c)}
                      className="px-2.5 py-1 text-slate-700 hover:text-navy-950 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-[11px]"
                    >
                      {language === "mr" ? "संपादित करा" : "Edit"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Edit/Create Modal */}
      {showAddModal && (
        <Modal
          title="Category editor"
          error={requestError}
          onClose={() => setShowAddModal(false)}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs"
          >
            <h3 className="font-bold text-base text-navy-950 border-b pb-2">
              {editingCat
                ? language === "mr"
                  ? "उद्योग शाखा संपादन"
                  : "Edit Category"
                : language === "mr"
                  ? "नवीन उद्योग शाखा निर्मिती"
                  : "Create New Category"}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label
                  className="font-bold text-slate-700 block"
                  htmlFor="field-1"
                >
                  {language === "mr"
                    ? "Slug (URL ओळख)"
                    : "Slug (URL identifier)"}
                </label>
                <input
                  id="field-1"
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="e.g. construction-contracting"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  className="font-bold text-slate-700 block"
                  htmlFor="field-2"
                >
                  {language === "mr" ? "नाव (मराठी)" : "Name (Marathi)"}
                </label>
                <input
                  id="field-2"
                  type="text"
                  value={formData.nameMr}
                  onChange={(e) =>
                    setFormData({ ...formData, nameMr: e.target.value })
                  }
                  placeholder={
                    language === "mr"
                      ? "उदा. बांधकाम व ठेकेदारी"
                      : "e.g. बांधकाम व ठेकेदारी"
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  className="font-bold text-slate-700 block"
                  htmlFor="field-3"
                >
                  {language === "mr" ? "नाव (इंग्रजी)" : "Name (English)"}
                </label>
                <input
                  id="field-3"
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, nameEn: e.target.value })
                  }
                  placeholder="e.g. Construction & Contracting"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label
                  className="font-bold text-slate-700 block"
                  htmlFor="field-4"
                >
                  {language === "mr"
                    ? "वर्णन (मराठी)"
                    : "Description (Marathi)"}
                </label>
                <input
                  id="field-4"
                  type="text"
                  value={formData.descriptionMr}
                  onChange={(e) =>
                    setFormData({ ...formData, descriptionMr: e.target.value })
                  }
                  placeholder={
                    language === "mr"
                      ? "थोडक्यात माहिती..."
                      : "Brief overview..."
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="space-y-1">
                <label
                  className="font-bold text-slate-700 block"
                  htmlFor="field-5"
                >
                  {language === "mr" ? "क्रम (Order)" : "Order"}
                </label>
                <input
                  id="field-5"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="space-y-1">
                <label
                  className="font-bold text-slate-700 block"
                  htmlFor="field-6"
                >
                  {language === "mr" ? "स्थिती" : "Status"}
                </label>
                <select
                  id="field-6"
                  value={formData.isActive ? "true" : "false"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isActive: e.target.value === "true",
                    })
                  }
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="true">
                    {language === "mr" ? "सक्रिय (Active)" : "Active"}
                  </option>
                  <option value="false">
                    {language === "mr" ? "निष्क्रिय (Inactive)" : "Inactive"}
                  </option>
                </select>
              </div>
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
                {language === "mr" ? "जतन करा" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
