"use client";
import { apiFetch } from "@/lib/client-api";

import { useLanguage } from "@/components/LanguageContext";
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import React, { useState } from "react";

export default function ContactPage() {
  const { language, t } = useLanguage();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const res = await apiFetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit inquiry");
      }

      setSuccess(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
          {t.contactTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {language === "mr"
            ? "या समुदाय व्यासपीठाच्या प्रशासकांना संदेश किंवा अभिप्राय पाठवा. खालील संस्थात्मक पत्ते जुन्या प्रकाशनातील संदर्भ आहेत; भेट देण्यापूर्वी चालू तपशील स्वतंत्रपणे निश्चित करा."
            : "Send a message or feedback to the community platform administrators. Office references below come from historical publication material; independently confirm current details before visiting."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Office Addresses from PDF */}
        <div className="space-y-4">
          {/* Panvel Central Office */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-2.5">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              <span>{t.panvelOfficeTitle}</span>
            </div>
            <h3 className="text-base font-bold text-navy-950">
              {language === "mr"
                ? "अखिल आगरी समाज परिषद (पनवेल)"
                : "Akhil Aagri Samaj Parishad (Panvel)"}
            </h3>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{t.panvelAddress}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{t.panvelPhone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                <a href="#inquiry-form">
                  {language === "mr"
                    ? "संकेतस्थळाच्या टीमला संदेश पाठवा"
                    : "Message the platform team"}
                </a>
              </div>
            </div>
          </div>

          {/* Trombay Contact Office */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              <span>{t.trombayOfficeTitle}</span>
            </div>
            <h3 className="text-base font-bold text-navy-950">
              {language === "mr"
                ? "विभागीय कार्यालय (मुंबई)"
                : "Branch Office (Trombay, Mumbai)"}
            </h3>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{t.trombayAddress}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{t.trombayPhone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inquiry Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-navy-950">
              {language === "mr"
                ? "ऑनलाइन संदेश किंवा विचारणा पाठवा"
                : "Send an Inquiry"}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {language === "mr"
                ? "आपला संदेश प्रशासकांना त्यांच्या डॅशबोर्डवर पाहण्यासाठी उपलब्ध होईल."
                : "The platform administrators can review your inquiry in their dashboard."}
            </p>
          </div>

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>
                {language === "mr"
                  ? "आपला संदेश यशस्वीरीत्या प्राप्त झाला आहे! आपला संदेश प्रशासकांना पाहण्यासाठी उपलब्ध आहे."
                  : "Inquiry submitted successfully! Your message is available for administrator review."}
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form id="inquiry-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label
                className="text-xs font-bold text-slate-700"
                htmlFor="field-1"
              >
                {language === "mr" ? "आपले पूर्ण नाव" : "Full Name"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="field-1"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={
                  language === "mr"
                    ? "उदा. सचिन म्हात्रे"
                    : "e.g. Sachin Mhatre"
                }
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  className="text-xs font-bold text-slate-700"
                  htmlFor="field-2"
                >
                  {language === "mr" ? "ईमेल" : "Email"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="field-2"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs font-bold text-slate-700"
                  htmlFor="field-3"
                >
                  {language === "mr" ? "मोबाईल" : "Phone"}
                </label>
                <input
                  id="field-3"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={language === "mr" ? "९८XXXXXXXX" : "98XXXXXXXX"}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                className="text-xs font-bold text-slate-700"
                htmlFor="field-4"
              >
                {language === "mr" ? "विषय" : "Subject"}
              </label>
              <input
                id="field-4"
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder={
                  language === "mr"
                    ? "उदा. डिरेक्टरी नोंदणीबाबत विचारणा"
                    : "e.g. Business directory listing inquiry"
                }
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label
                className="text-xs font-bold text-slate-700"
                htmlFor="field-5"
              >
                {language === "mr" ? "संदेश" : "Message"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                id="field-5"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                placeholder={
                  language === "mr"
                    ? "आपला संदेश येथे लिहा..."
                    : "Please write your message here..."
                }
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-sm font-bold transition shadow disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>
                {submitting
                  ? language === "mr"
                    ? "पाठवित आहे..."
                    : "Sending..."
                  : t.ctaSendInquiry}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
