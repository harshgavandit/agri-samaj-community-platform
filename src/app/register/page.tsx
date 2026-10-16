"use client";
import { apiFetch } from "@/lib/client-api";

import { useLanguage } from "@/components/LanguageContext";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function RegisterUserPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const returnPath = () => {
    const value = new URLSearchParams(window.location.search).get("returnTo");
    return value && /^\/(?![\\/])/.test(value) ? value : "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      router.push(returnPath() || "/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-navy-900 border border-amber-500/80 flex items-center justify-center text-white mx-auto shadow">
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-navy-950">
            {language === "mr" ? "नवीन सदस्य नोंदणी" : "Create Member Account"}
          </h1>
          <p className="text-xs text-slate-600">
            {language === "mr"
              ? "आगरी उद्योजक डिजिटल व्यासपीठाशी जोडले जा"
              : "Join the Agri Entrepreneur Digital Platform"}
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              className="text-xs font-bold text-slate-700"
              htmlFor="field-1"
            >
              {language === "mr" ? "पूर्ण नाव" : "Full Name"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="field-1"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={
                  language === "mr"
                    ? "उदा. राहुल शांताराम म्हात्रे"
                    : "e.g. Rahul Shantaram Mhatre"
                }
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              className="text-xs font-bold text-slate-700"
              htmlFor="field-2"
            >
              {language === "mr" ? "ईमेल पत्ता" : "Email Address"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="field-2"
                autoComplete="email"
                maxLength={254}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              className="text-xs font-bold text-slate-700"
              htmlFor="field-3"
            >
              {language === "mr" ? "मोबाईल क्रमांक" : "Mobile Number"}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="field-3"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={language === "mr" ? "९८XXXXXXXX" : "98XXXXXXXX"}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              className="text-xs font-bold text-slate-700"
              htmlFor="field-4"
            >
              {language === "mr" ? "पासवर्ड तयार करा" : "Password"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="field-4"
                autoComplete="new-password"
                minLength={12}
                maxLength={72}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={
                  language === "mr"
                    ? "किमान १२ अक्षरे/संख्या"
                    : "Minimum 12 characters"
                }
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-sm font-bold transition shadow disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>
              {loading
                ? language === "mr"
                  ? "नोंदणी होत आहे..."
                  : "Creating Account..."
                : t.navRegister}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t text-center text-xs text-slate-600">
          <span>
            {language === "mr"
              ? "आधीच खाते आहे?"
              : "Already have an account?"}{" "}
          </span>
          <Link
            href="/login"
            className="font-bold text-navy-950 hover:underline"
          >
            {t.navLogin}
          </Link>
        </div>
      </div>
    </div>
  );
}
