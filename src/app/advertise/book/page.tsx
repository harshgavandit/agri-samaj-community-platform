"use client";
import Feedback from "@/components/Feedback";
import { apiFetch } from "@/lib/client-api";
import { uploadFile } from "@/lib/upload-client";

import { useLanguage } from "@/components/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";

function AdBookingForm() {
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const [requestError, setRequestError] = useState("");

  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState(
    searchParams.get("package") || "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successResult, setSuccessResult] = useState<{
    bookingRef: string;
    amount: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    advertiserName: "",
    businessName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    adTextContent: "",
    artworkUrl: "",
    paymentMethod: "NEFT_RTGS",
    paymentReference: "",
  });
  const [uploadingArtwork, setUploadingArtwork] = useState(false);

  const handleArtworkUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingArtwork(true);
    setErrorMsg("");
    try {
      const uploadedUrl = await uploadFile(file);
      setFormData((prev) => ({ ...prev, artworkUrl: uploadedUrl }));
    } catch (err: any) {
      setErrorMsg(err.message || "Artwork upload error");
    } finally {
      setUploadingArtwork(false);
    }
  };

  useEffect(() => {
    apiFetch("/api/advertisements/packages")
      .then((r) => r.json())
      .then((data) => {
        if (data.packages && data.packages.length > 0) {
          setPackages(data.packages);
          if (!selectedPkgId) {
            setSelectedPkgId(data.packages[0].id);
          }
        }
      })
      .catch((error: Error) => setRequestError(error.message));
  }, []);

  const selectedPackage =
    packages.find((p) => p.id === selectedPkgId) || packages[0];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (
      !formData.advertiserName ||
      !formData.phone ||
      !formData.email ||
      !formData.adTextContent
    ) {
      setErrorMsg(
        language === "mr"
          ? "कृपया सर्व आवश्यक रकाने भरा."
          : "Please fill all required fields.",
      );
      return;
    }

    if (!selectedPackage) {
      setErrorMsg("Choose an available advertisement package.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/advertisements/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit booking");
      }

      setSuccessResult({
        bookingRef: data.bookingRef,
        amount: data.amount,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Error booking advertisement");
    } finally {
      setSubmitting(false);
    }
  };

  if (successResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-navy-950">
              {language === "mr"
                ? "जाहिरात नोंदणी यशस्वीरीत्या प्राप्त झाली!"
                : "Ad Booking Received Successfully!"}
            </h2>
            <div className="inline-block px-4 py-2 bg-amber-50 border border-amber-300 rounded-lg text-lg font-mono font-bold text-amber-900 my-2">
              {successResult.bookingRef}
            </div>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {language === "mr"
                ? `आपली नोंदणी प्राप्त झाली असून रक्कम ${formatCurrency(successResult.amount)} च्या देयक पडताळणीनंतर जाहिरात अंतिम मसुदा आपल्याला ईमेल/व्हॉट्सॲपवर पाठविला जाईल.`
                : `Booking registered for ${formatCurrency(successResult.amount)}. Our representative will contact you with the proof draft once payment is confirmed.`}
            </p>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <Link
              href="/advertise"
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {language === "mr" ? "दरपत्रकाकडे परत जा" : "Back to Rate Card"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <Feedback message={requestError} />
      {/* Back button */}
      <Link
        href="/advertise"
        className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-navy-950 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>
          {language === "mr"
            ? "जाहिरात दरपत्रकाकडे परत जा"
            : "Back to Packages"}
        </span>
      </Link>

      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-1">
        <div className="inline-flex items-center space-x-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded">
          <ShieldCheck className="w-4 h-4" />
          <span>
            {language === "mr"
              ? "अखिल आगरी समाज परिषद • आगरी उद्योजक पुस्तिका जाहिरात अर्ज"
              : "Akhil Agri Samaj Parishad • Business Directory Advertisement Booking"}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
          {language === "mr"
            ? "जाहिरात नोंदणी अर्ज"
            : "Advertisement Booking Application"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {language === "mr"
            ? "ऐतिहासिक जाहिरात नोंदणी अर्जाचे (फॉर्म क्र. ००००६०) अधिकृत डिजिटल स्वरूप."
            : "Official digital version of the historic advertisement registration form."}
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm flex items-center space-x-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-5 sm:p-7 rounded-xl border border-slate-200 shadow-sm space-y-5"
      >
        {/* Selected Package Banner */}
        <div className="p-4 bg-amber-50/70 border border-amber-300/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label
              className="text-xs font-bold text-amber-900 block uppercase"
              htmlFor="field-1"
            >
              {language === "mr"
                ? "निवडलेले जाहिरात पॅकेज:"
                : "Selected Package:"}
            </label>
            <select
              id="field-1"
              value={selectedPkgId}
              onChange={(e) => setSelectedPkgId(e.target.value)}
              className="mt-1 font-bold text-sm text-navy-950 bg-white border border-amber-300 rounded px-2 py-1"
            >
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {language === "mr" ? p.nameMr : p.nameEn} (
                  {formatCurrency(p.price)})
                </option>
              ))}
            </select>
          </div>

          {selectedPackage && (
            <div className="text-right">
              <span className="text-xs text-slate-600 block">
                {selectedPackage.dimensions}
              </span>
              <span className="text-xl font-extrabold text-navy-950">
                {formatCurrency(selectedPackage.price)}
              </span>
            </div>
          )}
        </div>

        {/* Advertiser Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              className="text-xs font-bold text-slate-700"
              htmlFor="field-2"
            >
              {language === "mr" ? "उद्योगाचे नाव" : "Business / Firm Name"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="field-2"
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder={
                language === "mr"
                  ? "उदा. सागर केटरर्स / निशांत म्हात्रे"
                  : "e.g. Sagar Caterers / Nishant Mhatre"
              }
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-xs font-bold text-slate-700"
              htmlFor="field-3"
            >
              {language === "mr"
                ? "जाहिरातदाराचे / संपर्क व्यक्तीचे नाव"
                : "Advertiser / Contact Person"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="field-3"
              type="text"
              name="advertiserName"
              value={formData.advertiserName}
              onChange={handleChange}
              placeholder={
                language === "mr"
                  ? "उदा. श्री. शांताराम म्हात्रे"
                  : "e.g. Shri Shantaram Mhatre"
              }
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-xs font-bold text-slate-700"
              htmlFor="field-4"
            >
              {language === "mr" ? "मोबाईल क्रमांक" : "Mobile Number"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="field-4"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={language === "mr" ? "९८XXXXXXXX" : "98XXXXXXXX"}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-xs font-bold text-slate-700"
              htmlFor="field-5"
            >
              {language === "mr" ? "ईमेल पत्ता" : "Email Address"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="field-5"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@business.com"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label
              className="text-xs font-bold text-slate-700"
              htmlFor="field-6"
            >
              {language === "mr" ? "पत्ता (Address)" : "Full Address"}
            </label>
            <input
              id="field-6"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder={
                language === "mr"
                  ? "दुकान क्र., इमारत, रस्ता, शहर, तालुका, जिल्हा"
                  : "Shop no., building, street, city, taluka, district"
              }
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Ad Copy / Content */}
        <div className="space-y-1 pt-2">
          <label className="text-xs font-bold text-slate-700" htmlFor="field-7">
            {language === "mr"
              ? "जाहिरातीचा मजकूर (Ad Copy / Text)"
              : "Advertisement Text / Copy"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            id="field-7"
            name="adTextContent"
            value={formData.adTextContent}
            onChange={handleChange}
            rows={4}
            placeholder={
              language === "mr"
                ? "जाहिरातीत छापणे आवश्यक असणारा मजकूर, ब्रीदवाक्य, उत्पादनांची यादी, संपर्क पत्ते..."
                : "Text to be published, tagline, product list, contact info..."
            }
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            required
          />
          <p className="text-[11px] text-slate-600">
            {language === "mr"
              ? "* ब्रोशर, व्हिजिटिंग कार्ड किंवा तयार आर्टवर्क असल्यास आपण नोंदणीनंतर आमच्या प्रतिनिधींना व्हॉट्सॲप / ईमेलद्वारे पाठवू शकता किंवा थेट खाली अपलोड करू शकता:"
              : "* If you have an artwork brochure, visiting card, or design file, you may upload it below or send via WhatsApp/Email:"}
          </p>

          <div className="pt-2">
            <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition">
              <span>
                {uploadingArtwork
                  ? language === "mr"
                    ? "आर्टवर्क अपलोड होत आहे..."
                    : "Uploading Artwork..."
                  : language === "mr"
                    ? "आर्टवर्क फाईल अपलोड करा (Upload Artwork)"
                    : "Upload Artwork File"}
              </span>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleArtworkUpload}
                className="hidden"
                disabled={uploadingArtwork}
              />
            </label>
            {formData.artworkUrl && (
              <span className="text-xs text-emerald-700 font-medium ml-3">
                ✓ {language === "mr" ? "फाईल जोडली गेली" : "File attached"} (
                {formData.artworkUrl})
              </span>
            )}
          </div>
        </div>

        {/* Payment Mode (PDF Page 2: रोख/चेक/ड्राफ्ट क्र.) */}
        <div className="pt-4 border-t space-y-4">
          <h3 className="text-sm font-bold text-navy-950 flex items-center space-x-1.5">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>
              {language === "mr" ? "पेमेंट / देयक पद्धत" : "Payment Method"}
            </span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {language === "mr" ? "पेमेंट प्रकार" : "Payment Mode"}
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
              >
                <option value="NEFT_RTGS">
                  {language === "mr"
                    ? "NEFT / RTGS बँक ट्रान्सफर"
                    : "NEFT / RTGS Bank Transfer"}
                </option>
                <option value="UPI">
                  {language === "mr"
                    ? "UPI / QR कोड स्कॅन"
                    : "UPI / QR Code Scan"}
                </option>
                <option value="CHEQUE_DRAFT">
                  {language === "mr"
                    ? "चेक / डिमांड ड्राफ्ट (DD)"
                    : "Cheque / Demand Draft (DD)"}
                </option>
                <option value="CASH">
                  {language === "mr"
                    ? "रोख देयक (कार्यालयात)"
                    : "Cash Payment (At Office)"}
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label
                className="text-xs font-bold text-slate-700"
                htmlFor="field-8"
              >
                {language === "mr"
                  ? "UTRs / चेक / ट्रॅन्झॅक्शन क्र. (ऐच्छिक)"
                  : "Transaction / Cheque Ref No."}
              </label>
              <input
                id="field-8"
                type="text"
                name="paymentReference"
                value={formData.paymentReference}
                onChange={handleChange}
                placeholder={
                  language === "mr"
                    ? "उदा. UTR98234234 / Chq No 123456"
                    : "e.g. UTR98234234 / Chq No 123456"
                }
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t flex justify-end">
          <button
            type="submit"
            disabled={submitting || uploadingArtwork || !selectedPackage}
            className="inline-flex items-center space-x-2 px-8 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-sm font-bold transition shadow disabled:opacity-50"
          >
            <span>
              {submitting
                ? language === "mr"
                  ? "नोंदणी होत आहे..."
                  : "Submitting..."
                : t.ctaBookAd}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function BookAdPage() {
  return (
    <Suspense
      fallback={<div className="p-12 text-center">Loading booking form...</div>}
    >
      <AdBookingForm />
    </Suspense>
  );
}
