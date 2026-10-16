"use client";
import Feedback from "@/components/Feedback";
import { apiFetch } from "@/lib/client-api";

import { useLanguage } from "@/components/LanguageContext";
import {
  ArrowLeft,
  ClipboardList,
  Lock,
  Plus,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function AdminCensusPage() {
  const { language } = useLanguage();
  const [requestError, setRequestError] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [isModuleEnabled, setIsModuleEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    enumeratorNo: "",
    surveyorName: "",
    divisionName: "",
    taluka: "",
    district: "",
    pincode: "",
    totalHouses: "",
    agriHouses: "",
    questionnairesReceivedFrom: "",
    questionnairesReceivedTo: "",
    questionnairesUsed: "",
    questionnairesBlank: "",
    questionnairesDamaged: "",
    notes: "",
  });

  const fetchCensusData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/census");
      const data = await res.json();
      if (data) {
        setIsModuleEnabled(data.isModuleEnabled);
        if (data.records) setRecords(data.records);
      }
    } catch (e) {
      setRequestError(
        e instanceof Error ? e.message : "Unable to complete the request.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCensusData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    if (saving) return;
    setSaving(true);
    setRequestError("");
    e.preventDefault();
    try {
      const res = await apiFetch("/api/admin/census", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddForm(false);
        fetchCensusData();
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
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
        <div className="inline-flex items-center space-x-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded">
          <Lock className="w-3.5 h-3.5" />
          <span>
            {language === "mr"
              ? "प्रतिबंधित विभाग (Restricted Module) • अधिकृत प्रगणक व प्रशासक केवळ"
              : "Restricted Module • Authorized Enumerators & Admins Only"}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
          {language === "mr"
            ? "आगरी समाज जनगणना मोहीम - प्रगणक व प्रश्नावली ट्रॅकर"
            : "Census Campaign - Enumerator & Questionnaire Tally"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {language === "mr"
            ? "ऐतिहासिक २००६ जनगणना मोहीम पत्रक (पृष्ठ ५) नुसार घरसंख्या, आगरी कुटुंबे टक्केवारी व प्रश्नावली ताळेबंद."
            : "Statistical tallies of households, community percentage, and questionnaire logs digitized from Page 5."}
        </p>
      </div>

      {/* Privacy Safeguard Notice */}
      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-xs sm:text-sm text-amber-950">
        <div className="flex items-center space-x-2 font-bold text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            {language === "mr"
              ? "गोपनीयता व कायदेशीर नियमावली (Strict Privacy Mandate)"
              : "Strict Privacy Mandate & Data Safeguards"}
          </span>
        </div>
        <p className="leading-relaxed">
          {language === "mr"
            ? "संस्थेच्या नियमावलीनुसार वैयक्तिक कुटुंबांची नावे, खाजगी पत्ते किंवा संवेदनशील समाज ओळख कधीही सार्वजनिक केली जात नाही. हे मॉड्यूल केवळ एकूण संख्यात्मक ताळेबंद, प्रश्नावली वाटप आणि सर्वेक्षकांच्या कामाच्या नोंदीसाठी मर्यादित आहे."
            : "Individual household identities, residential addresses, and private records are never published. This module is strictly restricted to statistical tallies, questionnaire distribution tracking, and enumerator accountability."}
        </p>
        <div className="pt-2 text-xs text-slate-600">
          {language === "mr" ? "मॉड्यूल स्थिती:" : "Module Status:"}{" "}
          <span className="font-bold text-navy-950">
            {isModuleEnabled
              ? language === "mr"
                ? "सक्रिय (Enabled by Admin)"
                : "Active (Enabled by Admin)"
              : language === "mr"
                ? "गोपनीयता सुरक्षेसाठी सार्वजनिक पातळीवर निष्क्रिय (Locked)"
                : "Locked from public view for privacy protection"}
          </span>
        </div>
      </div>

      {loading && (
        <p role="status">
          {language === "mr" ? "नोंदी लोड होत आहेत…" : "Loading records…"}
        </p>
      )}
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-950 flex items-center space-x-2">
          <ClipboardList className="w-5 h-5 text-amber-600" />
          <span>
            {language === "mr"
              ? "नोंदणीकृत विभाग व ताळेबंद यादी (Survey tallies)"
              : "Registered Divisions & Survey Tallies"}
          </span>
        </h2>
        <button
          disabled={!isModuleEnabled || saving}
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center space-x-1 px-4 py-2 bg-navy-950 hover:bg-navy-900 text-white rounded-xl text-xs font-bold transition shadow"
        >
          <Plus className="w-4 h-4" />
          <span>
            {language === "mr"
              ? "नवीन प्रगणक नोंद जोडा"
              : "Add Enumerator Entry"}
          </span>
        </button>
      </div>

      {/* Add New Census Entry Modal / Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow space-y-4 text-xs"
        >
          <h3 className="font-bold text-sm text-navy-950 border-b pb-2">
            {language === "mr"
              ? "नवीन प्रगणक अहवाल (Digitized Form Page 5)"
              : "New Enumerator Report (Digitized Form Page 5)"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                className="font-bold text-slate-700 block mb-1"
                htmlFor="field-1"
              >
                {language === "mr" ? "प्रगणक क्र." : "Enumerator No."}
              </label>
              <input
                id="field-1"
                type="text"
                value={formData.enumeratorNo}
                onChange={(e) =>
                  setFormData({ ...formData, enumeratorNo: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label
                className="font-bold text-slate-700 block mb-1"
                htmlFor="field-2"
              >
                {language === "mr" ? "सर्वेक्षकाचे नाव" : "Surveyor Name"}
              </label>
              <input
                id="field-2"
                type="text"
                value={formData.surveyorName}
                onChange={(e) =>
                  setFormData({ ...formData, surveyorName: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label
                className="font-bold text-slate-700 block mb-1"
                htmlFor="field-3"
              >
                {language === "mr" ? "विभागाचे नाव" : "Division Name"}
              </label>
              <input
                id="field-3"
                type="text"
                value={formData.divisionName}
                onChange={(e) =>
                  setFormData({ ...formData, divisionName: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label
                className="font-bold text-slate-700 block mb-1"
                htmlFor="field-4"
              >
                {language === "mr" ? "तालुका" : "Taluka"}
              </label>
              <input
                id="field-4"
                type="text"
                value={formData.taluka}
                onChange={(e) =>
                  setFormData({ ...formData, taluka: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label
                className="font-bold text-slate-700 block mb-1"
                htmlFor="field-5"
              >
                {language === "mr" ? "जिल्हा" : "District"}
              </label>
              <input
                id="field-5"
                type="text"
                value={formData.district}
                onChange={(e) =>
                  setFormData({ ...formData, district: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label
                className="font-bold text-slate-700 block mb-1"
                htmlFor="field-6"
              >
                {language === "mr" ? "एकूण घरे" : "Total Houses"}
              </label>
              <input
                id="field-6"
                type="number"
                value={formData.totalHouses}
                onChange={(e) =>
                  setFormData({ ...formData, totalHouses: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label
                className="font-bold text-slate-700 block mb-1"
                htmlFor="field-7"
              >
                {language === "mr" ? "आगरी घरे" : "Agri Houses"}
              </label>
              <input
                id="field-7"
                type="number"
                value={formData.agriHouses}
                onChange={(e) =>
                  setFormData({ ...formData, agriHouses: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label
                className="font-bold text-slate-700 block mb-1"
                htmlFor="field-8"
              >
                {language === "mr"
                  ? "वापरलेल्या प्रश्नावली"
                  : "Questionnaires Used"}
              </label>
              <input
                id="field-8"
                type="number"
                value={formData.questionnairesUsed}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    questionnairesUsed: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label
                className="font-bold text-slate-700 block mb-1"
                htmlFor="field-9"
              >
                {language === "mr"
                  ? "कोऱ्या प्रश्नावली"
                  : "Blank Questionnaires"}
              </label>
              <input
                id="field-9"
                type="number"
                value={formData.questionnairesBlank}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    questionnairesBlank: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            {(
              [
                "pincode",
                "questionnairesReceivedFrom",
                "questionnairesReceivedTo",
                "questionnairesDamaged",
              ] as const
            ).map((key) => (
              <div key={key}>
                <label
                  htmlFor={`census-${key}`}
                  className="font-bold text-slate-700 block mb-1"
                >
                  {
                    {
                      pincode: language === "mr" ? "पिन कोड" : "Pincode",
                      questionnairesReceivedFrom:
                        language === "mr"
                          ? "प्राप्त प्रश्नावली सुरुवात"
                          : "Questionnaire start",
                      questionnairesReceivedTo:
                        language === "mr"
                          ? "प्राप्त प्रश्नावली शेवट"
                          : "Questionnaire end",
                      questionnairesDamaged:
                        language === "mr"
                          ? "खराब प्रश्नावली"
                          : "Damaged questionnaires",
                    }[key]
                  }
                </label>
                <input
                  id={`census-${key}`}
                  type={key === "pincode" ? "text" : "number"}
                  min={0}
                  required={key === "pincode"}
                  value={formData[key]}
                  onChange={(e) =>
                    setFormData({ ...formData, [key]: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              disabled={saving}
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border rounded"
            >
              {language === "mr" ? "रद्द करा" : "Cancel"}
            </button>
            <button
              disabled={saving}
              type="submit"
              className="px-6 py-2 bg-emerald-700 text-white font-bold rounded"
            >
              {language === "mr" ? "जतन करा" : "Save"}
            </button>
          </div>
        </form>
      )}

      {/* Records Table */}
      {records.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-bold">
                  {language === "mr" ? "प्रगणक क्र." : "Enumerator No."}
                </th>
                <th className="px-4 py-3 text-left font-bold">
                  {language === "mr" ? "सर्वेक्षक" : "Surveyor"}
                </th>
                <th className="px-4 py-3 text-left font-bold">
                  {language === "mr" ? "विभाग व तालुका" : "Division & Taluka"}
                </th>
                <th className="px-4 py-3 text-left font-bold">
                  {language === "mr" ? "एकूण घरे" : "Total Houses"}
                </th>
                <th className="px-4 py-3 text-left font-bold">
                  {language === "mr" ? "आगरी घरे" : "Agri Houses"}
                </th>
                <th className="px-4 py-3 text-left font-bold">
                  {language === "mr" ? "टक्केवारी" : "Percentage"}
                </th>
                <th className="px-4 py-3 text-left font-bold">
                  {language === "mr"
                    ? "प्रश्नावली ताळेबंद (वापर/कोऱ्या)"
                    : "Questionnaire Balance (Used/Blank)"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-mono font-bold text-navy-950">
                    {r.enumeratorNo}
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.surveyorName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.divisionName}, {r.taluka}
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.totalHouses}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">
                    {r.agriHouses}
                  </td>
                  <td className="px-4 py-3 font-bold text-navy-950">
                    {r.agriPercentage}%
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {language === "mr"
                      ? `वापरलेल्या: ${r.questionnairesUsed || 0} | कोऱ्या: ${r.questionnairesBlank || 0}`
                      : `Used: ${r.questionnairesUsed || 0} | Blank: ${r.questionnairesBlank || 0}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-600 space-y-2">
          <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
          <p>
            {language === "mr"
              ? "सध्या कोणताही प्रत्यक्ष सर्व्हे रेकॉर्ड नोंदवलेला नाही."
              : "No survey tallies registered currently."}
          </p>
        </div>
      )}
    </div>
  );
}
