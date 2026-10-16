"use client";
import Feedback from "@/components/Feedback";
import { apiFetch } from "@/lib/client-api";
import { uploadFile } from "@/lib/upload-client";

import { useLanguage } from "@/components/LanguageContext";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Loader2,
  Save,
  ShieldCheck,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";

function RegisterBusinessForm() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id") || searchParams.get("edit") || "";

  const { language, t } = useLanguage();
  const [requestError, setRequestError] = useState("");

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<{
    refNumber: string;
    isDraft: boolean;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: editId,
    refNumber: "",
    // Step 1: Entrepreneur
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ownerEducationSchool: "",
    ownerEducationVocational: "",
    // Step 2: Business Core
    businessName: "",
    brandName: "",
    categoryId: "",
    subCategory: "",
    productsServices: "",
    description: "",
    establishedYear: new Date().getFullYear().toString(),
    businessClassification: "MANUFACTURER",
    ownershipType: "PROPRIETORSHIP",
    workNature: "FULL_TIME",
    startedBy: "SELF",
    // Step 3: Address
    officeAddress: "",
    officeCity: "",
    officeTaluka: "पनवेल",
    officeDistrict: "रायगड",
    officePincode: "",
    officePhone: "",
    hasFactory: false,
    factoryAddress: "",
    factoryCity: "",
    factoryTaluka: "",
    factoryDistrict: "रायगड",
    factoryPincode: "",
    isAddressPublic: true,
    // Step 4: Operations
    premisesOwnership: "OWNED",
    areaSqm: "",
    employeeCountFemale: "0",
    employeeCountMale: "0",
    employeeCountTotal: "0",
    website: "",
    phone: "",
    email: "",
    // Step 5: Verification
    logoUrl: "",
    documentUrl: "",
    termsAccepted: false,
  });

  // Load categories and existing profile if editing
  useEffect(() => {
    apiFetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
          setFormData((prev) => ({
            ...prev,
            categoryId: prev.categoryId || data.categories[0].id,
          }));
        }
      })
      .catch((error: Error) => setRequestError(error.message));

    if (editId) {
      apiFetch(`/api/businesses/${editId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.business) {
            const b = data.business;
            setFormData({
              id: b.id,
              refNumber: b.refNumber || "",
              ownerName: b.ownerName || "",
              ownerPhone: b.ownerPhone || "",
              ownerEmail: b.ownerEmail || "",
              ownerEducationSchool: b.ownerEducationSchool || "",
              ownerEducationVocational: b.ownerEducationVocational || "",
              businessName: b.businessName || "",
              brandName: b.brandName || "",
              categoryId: b.categoryId || "",
              subCategory: b.subCategory || "",
              productsServices: b.productsServices || "",
              description: b.description || "",
              establishedYear: b.establishedYear
                ? b.establishedYear.toString()
                : "",
              businessClassification:
                b.businessClassification || "MANUFACTURER",
              ownershipType: b.ownershipType || "PROPRIETORSHIP",
              workNature: b.workNature || "FULL_TIME",
              startedBy: b.startedBy || "SELF",
              officeAddress: b.officeAddress || "",
              officeCity: b.officeCity || "",
              officeTaluka: b.officeTaluka || "पनवेल",
              officeDistrict: b.officeDistrict || "रायगड",
              officePincode: b.officePincode || "",
              officePhone: b.officePhone || "",
              hasFactory: Boolean(b.factoryAddress),
              factoryAddress: b.factoryAddress || "",
              factoryCity: b.factoryCity || "",
              factoryTaluka: b.factoryTaluka || "",
              factoryDistrict: b.factoryDistrict || "रायगड",
              factoryPincode: b.factoryPincode || "",
              isAddressPublic: b.isAddressPublic !== false,
              premisesOwnership: b.premisesOwnership || "OWNED",
              areaSqm: b.areaSqm ? b.areaSqm.toString() : "",
              employeeCountFemale: (b.employeeCountFemale || 0).toString(),
              employeeCountMale: (b.employeeCountMale || 0).toString(),
              employeeCountTotal: (b.employeeCountTotal || 0).toString(),
              website: b.website || "",
              phone: b.phone || b.ownerPhone || "",
              email: b.email || b.ownerEmail || "",
              logoUrl: b.logoUrl || "",
              documentUrl: b.documentUrl || "",
              termsAccepted: Boolean(b.termsAccepted),
            });
          }
        })
        .catch((error: Error) => setRequestError(error.message));
    }
  }, [editId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "employeeCountFemale" || name === "employeeCountMale") {
        const female = parseInt(
          name === "employeeCountFemale"
            ? value || "0"
            : prev.employeeCountFemale || "0",
          10,
        );
        const male = parseInt(
          name === "employeeCountMale"
            ? value || "0"
            : prev.employeeCountMale || "0",
          10,
        );
        updated.employeeCountTotal = (female + male).toString();
      }

      return updated;
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: "documentUrl" | "logoUrl",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (targetField === "documentUrl") setUploadingDoc(true);
    else setUploadingLogo(true);
    setErrorMsg("");

    try {
      if (targetField === "logoUrl" && !file.type.startsWith("image/"))
        throw new Error("Choose a JPG, PNG or WebP image for the logo.");
      const uploadedUrl = await uploadFile(file);

      setFormData((prev) => ({
        ...prev,
        [targetField]: uploadedUrl,
      }));
    } catch (err: any) {
      setErrorMsg(err.message || "File upload error");
    } finally {
      if (targetField === "documentUrl") setUploadingDoc(false);
      else setUploadingLogo(false);
    }
  };

  const handleNext = () => {
    setErrorMsg("");
    if (step === 1) {
      if (!formData.ownerName.trim() || !formData.ownerPhone.trim()) {
        setErrorMsg(
          language === "mr"
            ? "कृपया उद्योजकाचे नाव आणि मोबाईल क्रमांक भरा."
            : "Please enter entrepreneur name and phone.",
        );
        return;
      }
    }
    if (step === 2) {
      if (!formData.businessName.trim() || !formData.productsServices.trim()) {
        setErrorMsg(
          language === "mr"
            ? "कृपया उद्योगाचे नाव आणि उत्पादने/सेवा भरा."
            : "Please enter business name and products/services.",
        );
        return;
      }
    }
    if (step === 3) {
      if (
        !formData.officeAddress.trim() ||
        !formData.officeCity.trim() ||
        !formData.officePincode.trim()
      ) {
        setErrorMsg(
          language === "mr"
            ? "कृपया कार्यालयाचा पत्ता, शहर आणि पिन कोड भरा."
            : "Please enter office address, city, and pincode.",
        );
        return;
      }
    }
    setStep((prev) => Math.min(5, prev + 1));
  };

  const handlePrevious = () => {
    setErrorMsg("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (isDraft = false) => {
    setErrorMsg("");
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        isDraft,
      };

      const res = await apiFetch("/api/businesses/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit registration");
      }

      setSuccessData({
        refNumber: data.refNumber,
        isDraft,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Error submitting registration");
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-navy-950">
              {successData.isDraft
                ? language === "mr"
                  ? "मसुदा सुरक्षितपणे जतन करण्यात आला!"
                  : "Draft Saved Successfully!"
                : t.submissionSuccess}
            </h2>
            <div className="inline-block px-4 py-2 bg-amber-50 border border-amber-300 rounded-lg text-lg font-mono font-bold text-amber-900 my-2">
              {successData.refNumber}
            </div>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {successData.isDraft
                ? language === "mr"
                  ? "आपला मसुदा जतन झाला आहे. आपण आपल्या डॅशबोर्डमधून कधीही हा अर्ज पूर्ण करू शकता."
                  : "Your draft has been saved. You can resume and complete this submission from your dashboard anytime."
                : t.submissionReviewNote}
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href={`/directory`}
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {t.ctaExploreBusinesses}
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition"
            >
              {t.navDashboard}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <Feedback message={requestError} />
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-1">
        <div className="inline-flex items-center space-x-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded">
          <ShieldCheck className="w-4 h-4" />
          <span>
            {language === "mr"
              ? "अखिल आगरी समाज परिषद • आगरी उद्योजक पुस्तिका डिजिटल अर्ज"
              : "Akhil Agri Samaj Parishad • Business Directory Digital Application"}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
          {formData.refNumber
            ? `${language === "mr" ? "नोंदणी अर्ज सुधारणा / संपादन" : "Edit Application"}: ${formData.refNumber}`
            : t.ctaRegisterBusiness}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {language === "mr"
            ? "ऐतिहासिक २००६ व २०१२ उद्योजक पुस्तिकेच्या आधारे तयार केलेला ५-टप्प्यांचा डिजिटल नोंदणी अर्ज."
            : "5-step digital registration workflow digitized directly from the official 2006 registration form."}
        </p>
      </div>

      {/* Step Progress Tracker */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-5 gap-2 text-center text-xs font-semibold">
          {[
            { num: 1, label: t.regStep1 },
            { num: 2, label: t.regStep2 },
            { num: 3, label: t.regStep3 },
            { num: 4, label: t.regStep4 },
            { num: 5, label: t.regStep5 },
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`p-2 rounded-lg cursor-pointer transition ${
                step === s.num
                  ? "bg-amber-600 text-white font-bold shadow"
                  : step > s.num
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              <span className="block text-[11px] truncate">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm flex items-center space-x-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Multi-Step Form */}
      <div className="bg-white p-5 sm:p-7 rounded-xl border border-slate-200/90 shadow-sm space-y-5">
        {/* STEP 1: Entrepreneur Details */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-navy-950 border-b pb-3">
              {t.regStep1}{" "}
              {language === "mr"
                ? "(उद्योजक माहिती)"
                : "(Entrepreneur Details)"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label
                  htmlFor="ownerName"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.ownerNameLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  id="ownerName"
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder={
                    language === "mr"
                      ? "उदा. पाटील सचिन बाळाराम"
                      : "e.g. Patil Sachin Balaram"
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="ownerPhone"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.ownerPhoneLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  id="ownerPhone"
                  type="tel"
                  name="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={handleChange}
                  placeholder={language === "mr" ? "९८XXXXXXXX" : "98XXXXXXXX"}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="ownerEmail"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.ownerEmailLabel}
                </label>
                <input
                  id="ownerEmail"
                  type="email"
                  name="ownerEmail"
                  value={formData.ownerEmail}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="ownerEducationSchool"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.ownerSchoolLabel}
                </label>
                <input
                  id="ownerEducationSchool"
                  type="text"
                  name="ownerEducationSchool"
                  value={formData.ownerEducationSchool}
                  onChange={handleChange}
                  placeholder={
                    language === "mr"
                      ? "उदा. १० वी, १२ वी (कला/विज्ञान/वाणिज्य)"
                      : "e.g. 10th, 12th (Arts/Science/Commerce)"
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="ownerEducationVocational"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.ownerVocationalLabel}
                </label>
                <input
                  id="ownerEducationVocational"
                  type="text"
                  name="ownerEducationVocational"
                  value={formData.ownerEducationVocational}
                  onChange={handleChange}
                  placeholder={
                    language === "mr"
                      ? "उदा. ITI, डिप्लोमा, B.E., B.Com, LLB, MBA"
                      : "e.g. ITI, Diploma, B.E., B.Com, LLB, MBA"
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Business Core Details */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-navy-950 border-b pb-3">
              {t.regStep2}{" "}
              {language === "mr" ? "(उद्योग तपशील)" : "(Business Core Details)"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="businessName"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.businessNameLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  id="businessName"
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder={
                    language === "mr"
                      ? "उदा. श्री कृपा इंजिनिअरिंग वर्क्स"
                      : "e.g. Shri Kripa Engineering Works"
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="brandName"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.brandNameLabel}
                </label>
                <input
                  id="brandName"
                  type="text"
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleChange}
                  placeholder={
                    language === "mr"
                      ? "उदा. Shreekripa Fabrications"
                      : "e.g. Shreekripa Fabrications"
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="categoryId"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.categorySelectLabel}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {language === "mr" ? c.nameMr : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="subCategory"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.subCategoryLabel}
                </label>
                <input
                  id="subCategory"
                  type="text"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  placeholder={
                    language === "mr"
                      ? "उदा. हेवी स्ट्रक्चरल फॅब्रिकेशन"
                      : "e.g. Heavy Structural Fabrication"
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label
                  htmlFor="productsServices"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.productsServicesLabel}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="productsServices"
                  name="productsServices"
                  value={formData.productsServices}
                  onChange={handleChange}
                  rows={2}
                  placeholder={
                    language === "mr"
                      ? "आपण कोणत्या वस्तू बनवता किंवा कोणत्या सेवा पुरवता?"
                      : "What products do you manufacture or services do you provide?"
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label
                  htmlFor="description"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.descriptionLabel}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder={
                    language === "mr"
                      ? "व्यवसायाचा थोडक्यात इतिहास, अनुभव किंवा वैशिष्ट्ये..."
                      : "Brief history, experience, or specialty of your enterprise..."
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="businessClassification"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.classificationLabel}
                </label>
                <select
                  id="businessClassification"
                  name="businessClassification"
                  value={formData.businessClassification}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  <option value="MANUFACTURER">
                    {t.classificationManufacturer}
                  </option>
                  <option value="TRADER">{t.classificationTrader}</option>
                  <option value="CONTRACTOR">
                    {t.classificationContractor}
                  </option>
                  <option value="PROFESSIONAL">
                    {t.classificationProfessional}
                  </option>
                  <option value="OTHER">{t.classificationOther}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="ownershipType"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.ownershipLabel}
                </label>
                <select
                  id="ownershipType"
                  name="ownershipType"
                  value={formData.ownershipType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  <option value="PROPRIETORSHIP">
                    {t.ownershipProprietorship}
                  </option>
                  <option value="PARTNERSHIP">{t.ownershipPartnership}</option>
                  <option value="PVT_LTD">{t.ownershipPvtLtd}</option>
                  <option value="OTHER">
                    {language === "mr" ? "इतर (Other)" : "Other"}
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="workNature"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.workNatureLabel}
                </label>
                <select
                  id="workNature"
                  name="workNature"
                  value={formData.workNature}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  <option value="FULL_TIME">{t.workNatureFullTime}</option>
                  <option value="PART_TIME">{t.workNaturePartTime}</option>
                  <option value="SEASONAL">{t.workNatureSeasonal}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="startedBy"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.startedByLabel}
                </label>
                <select
                  id="startedBy"
                  name="startedBy"
                  value={formData.startedBy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  <option value="SELF">{t.startedBySelf}</option>
                  <option value="FAMILY">{t.startedByFamily}</option>
                  <option value="ANCESTRAL">{t.startedByAncestral}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="establishedYear"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.establishedYearLabel}
                </label>
                <input
                  id="establishedYear"
                  type="number"
                  name="establishedYear"
                  value={formData.establishedYear}
                  onChange={handleChange}
                  min="1950"
                  max="2030"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Address & Site Details */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-navy-950 border-b pb-3">
              {t.regStep3}{" "}
              {language === "mr"
                ? "(पत्ता व लोकेशन)"
                : "(Addresses & Location)"}
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="officeAddress"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.officeAddressLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  id="officeAddress"
                  type="text"
                  name="officeAddress"
                  value={formData.officeAddress}
                  onChange={handleChange}
                  placeholder={
                    language === "mr"
                      ? "इमारतीचे नाव, दुकान क्र., रस्ता / खूण"
                      : "Building name, shop no., street / landmark"
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="officeCity"
                    className="text-xs font-bold text-slate-700"
                  >
                    {t.cityLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="officeCity"
                    type="text"
                    name="officeCity"
                    value={formData.officeCity}
                    onChange={handleChange}
                    placeholder={
                      language === "mr" ? "उदा. पनवेल" : "e.g. Panvel"
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="officeTaluka"
                    className="text-xs font-bold text-slate-700"
                  >
                    {t.talukaLabel}
                  </label>
                  <input
                    id="officeTaluka"
                    type="text"
                    name="officeTaluka"
                    value={formData.officeTaluka}
                    onChange={handleChange}
                    placeholder={
                      language === "mr"
                        ? "उदा. पनवेल / उरण / पेण"
                        : "e.g. Panvel / Uran / Pen"
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="officeDistrict"
                    className="text-xs font-bold text-slate-700"
                  >
                    {t.districtLabel}
                  </label>
                  <input
                    id="officeDistrict"
                    type="text"
                    name="officeDistrict"
                    value={formData.officeDistrict}
                    onChange={handleChange}
                    placeholder={
                      language === "mr"
                        ? "रायगड / ठाणे / मुंबई"
                        : "Raigad / Thane / Mumbai"
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="officePincode"
                    className="text-xs font-bold text-slate-700"
                  >
                    {t.pincodeLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="officePincode"
                    type="text"
                    name="officePincode"
                    value={formData.officePincode}
                    onChange={handleChange}
                    placeholder="410206"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label
                    htmlFor="officePhone"
                    className="text-xs font-bold text-slate-700"
                  >
                    {t.officePhoneLabel}
                  </label>
                  <input
                    id="officePhone"
                    type="text"
                    name="officePhone"
                    value={formData.officePhone}
                    onChange={handleChange}
                    placeholder={
                      language === "mr" ? "०२२-२७XXXXXX" : "022-27XXXXXX"
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional Factory/Workshop Address */}
              <div className="pt-4 border-t space-y-3">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasFactory"
                    checked={formData.hasFactory}
                    onChange={handleChange}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>{t.hasFactoryLabel}</span>
                </label>

                {formData.hasFactory && (
                  <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="factoryAddress"
                        className="text-xs font-bold text-slate-700"
                      >
                        {t.factoryAddressLabel}
                      </label>
                      <input
                        id="factoryAddress"
                        type="text"
                        name="factoryAddress"
                        value={formData.factoryAddress}
                        onChange={handleChange}
                        placeholder={
                          language === "mr"
                            ? "प्लॉट क्र., MIDC / इंडस्ट्रियल एरिया"
                            : "Plot no., MIDC / Industrial Area"
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Public visibility consent */}
              <div className="pt-2">
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAddressPublic"
                    checked={formData.isAddressPublic}
                    onChange={handleChange}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>{t.isAddressPublicLabel}</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Operations & Scope */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-navy-950 border-b pb-3">
              {t.regStep4}{" "}
              {language === "mr" ? "(कामकाज व स्वरूप)" : "(Operational Scope)"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="premisesOwnership"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.premisesOwnershipLabel}
                </label>
                <select
                  id="premisesOwnership"
                  name="premisesOwnership"
                  value={formData.premisesOwnership}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  <option value="OWNED">{t.premisesOwned}</option>
                  <option value="RENTED">{t.premisesRented}</option>
                  <option value="OTHER">
                    {language === "mr" ? "इतर (Other)" : "Other"}
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="areaSqm"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.areaSqmLabel}
                </label>
                <input
                  id="areaSqm"
                  type="number"
                  name="areaSqm"
                  value={formData.areaSqm}
                  onChange={handleChange}
                  placeholder={language === "mr" ? "उदा. 150" : "e.g. 150"}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="employeeCountFemale"
                  className="text-xs font-bold text-slate-700"
                >
                  {language === "mr"
                    ? "कर्मचारी (स्त्री संख्या)"
                    : "Female Employees"}
                </label>
                <input
                  id="employeeCountFemale"
                  type="number"
                  name="employeeCountFemale"
                  value={formData.employeeCountFemale}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="employeeCountMale"
                  className="text-xs font-bold text-slate-700"
                >
                  {language === "mr"
                    ? "कर्मचारी (पुरुष संख्या)"
                    : "Male Employees"}
                </label>
                <input
                  id="employeeCountMale"
                  type="number"
                  name="employeeCountMale"
                  value={formData.employeeCountMale}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="employeeCountTotal"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.employeesTotalLabel}
                </label>
                <input
                  id="employeeCountTotal"
                  type="text"
                  readOnly
                  value={formData.employeeCountTotal}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-slate-100 text-slate-600 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="website"
                  className="text-xs font-bold text-slate-700"
                >
                  {t.websiteLabel}
                </label>
                <input
                  id="website"
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Verification, Document Upload & Declarations */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-navy-950 border-b pb-3">
              {t.regStep5}{" "}
              {language === "mr" ? "(पडताळणी व अटी)" : "(Verification & Terms)"}
            </h2>

            {/* Document Upload Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Verification Document Upload */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>
                    {language === "mr"
                      ? "व्यवसाय पडताळणी कागदपत्र (GST / Udyam / Shop Act / Card)"
                      : "Business Verification Document (GST / Udyam / Shop Act / Card)"}
                  </span>
                </label>
                <div className="text-[11px] text-slate-600">
                  {language === "mr"
                    ? "PDF किंवा इमेज (Max 5MB)"
                    : "PDF or Image (Max 5MB)"}
                </div>

                <div className="pt-1">
                  <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-amber-500 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition">
                    {uploadingDoc ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        <span>
                          {language === "mr"
                            ? "अपलोड होत आहे..."
                            : "Uploading..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {language === "mr" ? "फाईल निवडा" : "Choose File"}
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={(e) => handleFileUpload(e, "documentUrl")}
                      className="sr-only"
                      disabled={uploadingDoc}
                    />
                  </label>
                </div>

                {formData.documentUrl && (
                  <div className="text-xs text-emerald-700 flex items-center space-x-1 font-medium pt-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <a
                      href={formData.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {language === "mr"
                        ? "अपलोड केलेले कागदपत्र पहा"
                        : "View Uploaded Document"}
                    </a>
                  </div>
                )}
              </div>

              {/* Logo Upload */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <span>
                    {language === "mr"
                      ? "व्यवसायाचा लोगो किंवा फोटो"
                      : "Business Logo or Photo"}
                  </span>
                </label>
                <div className="text-[11px] text-slate-600">
                  {language === "mr"
                    ? "PNG / JPG / WebP (Max 5MB)"
                    : "PNG / JPG / WebP (Max 5MB)"}
                </div>

                <div className="pt-1">
                  <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-amber-500 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition">
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        <span>
                          {language === "mr"
                            ? "अपलोड होत आहे..."
                            : "Uploading..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {language === "mr" ? "लोगो निवडा" : "Choose Logo"}
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleFileUpload(e, "logoUrl")}
                      className="sr-only"
                      disabled={uploadingLogo}
                    />
                  </label>
                </div>

                {formData.logoUrl && (
                  <div className="text-xs text-emerald-700 flex items-center space-x-1 font-medium pt-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <a
                      href={formData.logoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {language === "mr"
                        ? "अपलोड केलेला लोगो पहा"
                        : "View Uploaded Logo"}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Submission Preview Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
              <h3 className="font-bold text-navy-950 text-sm">
                {language === "mr"
                  ? "नोंदणी अर्जाचा पूर्वदृश्य (Summary Preview)"
                  : "Registration Application Summary Preview"}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <strong>
                    {language === "mr" ? "उद्योजक:" : "Entrepreneur:"}
                  </strong>{" "}
                  {formData.ownerName}
                </div>
                <div>
                  <strong>{language === "mr" ? "मोबाईल:" : "Mobile:"}</strong>{" "}
                  {formData.ownerPhone}
                </div>
                <div>
                  <strong>
                    {language === "mr" ? "उद्योग:" : "Enterprise:"}
                  </strong>{" "}
                  {formData.businessName}
                </div>
                <div>
                  <strong>{language === "mr" ? "ब्रँड:" : "Brand:"}</strong>{" "}
                  {formData.brandName || "-"}
                </div>
                <div>
                  <strong>{language === "mr" ? "पत्ता:" : "Address:"}</strong>{" "}
                  {formData.officeAddress}, {formData.officeCity}
                </div>
                <div>
                  <strong>
                    {language === "mr" ? "स्वरूप:" : "Classification:"}
                  </strong>{" "}
                  {formData.businessClassification}
                </div>
                <div className="col-span-2">
                  <strong>
                    {language === "mr" ? "उत्पादने:" : "Products / Services:"}
                  </strong>{" "}
                  {formData.productsServices}
                </div>
              </div>
            </div>

            {/* Terms and conditions acceptance */}
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
              <label className="flex items-start space-x-2 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="leading-relaxed">{t.termsAcceptance}</span>
              </label>
            </div>
          </div>
        )}

        {/* Form Controls / Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting || uploadingDoc || uploadingLogo}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Save className="w-4 h-4 text-slate-600" />
            <span>{t.ctaSaveDraft}</span>
          </button>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="inline-flex items-center space-x-1 px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.ctaPrevious}</span>
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center space-x-1 px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow"
              >
                <span>{t.ctaNext}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting || !formData.termsAccepted}
                className="inline-flex items-center space-x-1.5 px-8 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>
                  {submitting
                    ? language === "mr"
                      ? "सादर होत आहे..."
                      : "Submitting..."
                    : t.ctaSubmit}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterBusinessPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center">Loading registration wizard...</div>
      }
    >
      <RegisterBusinessForm />
    </Suspense>
  );
}
