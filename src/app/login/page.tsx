"use client";
import { apiFetch } from "@/lib/client-api";

import { useLanguage } from "@/components/LanguageContext";
import { AlertCircle, ArrowRight, Building2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const returnPath = () => {
    const value = new URLSearchParams(window.location.search).get("returnTo");
    return value && /^\/(?![\\/])/.test(value) ? value : "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password");
      }

      const destination = returnPath();
      if (destination) {
        router.push(destination);
      } else if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user?.role === "ENUMERATOR") {
        router.push("/admin/census");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed");
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
            {language === "mr"
              ? "खात्यात लॉगिन करा"
              : "Sign In to Your Account"}
          </h1>
          <p className="text-xs text-slate-600">
            {language === "mr"
              ? "आपल्या व्यवसाय नोंदणी व जाहिरातींचे व्यवस्थापन करा"
              : "Manage your registered businesses and advertisements"}
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
              {language === "mr" ? "ईमेल पत्ता" : "Email Address"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="field-1"
                autoComplete="email"
                maxLength={254}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
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
              {language === "mr" ? "पासवर्ड" : "Password"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="field-2"
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-navy-950 hover:bg-navy-900 text-white rounded-xl text-sm font-bold transition shadow disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>
              {loading
                ? language === "mr"
                  ? "पडताळणी होत आहे..."
                  : "Verifying..."
                : t.navLogin}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t text-center text-xs text-slate-600">
          <span>
            {language === "mr" ? "खाते नाही?" : "Don't have an account?"}{" "}
          </span>
          <Link
            href="/register"
            className="font-bold text-amber-700 hover:text-amber-800"
          >
            {t.navRegister}
          </Link>
        </div>
      </div>
    </div>
  );
}
