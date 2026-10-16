"use client";

import {
  Building2,
  Globe,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/client-api";
import Feedback from "./Feedback";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageContext";

export default function Navbar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [logoutError, setLogoutError] = useState("");
  const [logoutPending, setLogoutPending] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    // Check logged in status from API
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === "mr" ? "en" : "mr");
  };

  const navLinks = [
    { href: "/", label: t.navHome },
    { href: "/directory", label: t.navDirectory },
    {
      href: "/register-business",
      label: t.navRegisterBusiness,
      highlight: true,
    },
    { href: "/advertise", label: t.navAdvertising },
    { href: "/publications", label: t.navPublications },
    { href: "/initiatives", label: t.navInitiatives },
    { href: "/contact", label: t.navContact },
  ];

  const handleLogout = async () => {
    if (logoutPending) return;
    setLogoutPending(true);
    setLogoutError("");
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Unable to sign out. Please try again.",
      );
    } finally {
      setLogoutPending(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-navy-100 shadow-sm">
      <Feedback message={logoutError} />
      {/* Top Notification / Trust Bar */}
      <div className="bg-navy-950 text-slate-300 text-xs py-1.5 px-4 hidden sm:block">
        <div className="w-full max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
            <span>{t.regNotice}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">
              {language === "mr"
                ? "मध्यवर्ती कार्यालय: पनवेल | विभागीय: ट्रॉम्बे, मुंबई"
                : "Central Office: Panvel | Branch: Trombay, Mumbai"}
            </span>
            <span className="text-amber-400 font-medium">
              {language === "mr"
                ? "हेल्पलाइन: ०२२-२७४५६२७८"
                : "Helpline: 022-27456278"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 group min-w-0"
          >
            <div className="w-10 h-10 shrink-0 rounded-lg bg-navy-900 border border-amber-500/80 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-sm sm:text-lg font-bold tracking-tight text-navy-950 block leading-tight">
                {language === "mr"
                  ? "अखिल आगरी समाज परिषद"
                  : "Akhil Aagri Samaj Parishad"}
              </span>
              <span className="text-[9px] sm:text-[11px] text-copper-600 font-medium block">
                {language === "mr"
                  ? "आगरी उद्योजक डिजिटल व्यासपीठ"
                  : "Agri Entrepreneur Digital Network"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden min-[1440px]:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    link.highlight
                      ? "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 flex items-center space-x-1 font-semibold ml-1"
                      : isActive
                        ? "text-navy-900 bg-slate-100 font-semibold"
                        : "text-slate-700 hover:text-navy-900 hover:bg-slate-50"
                  }`}
                >
                  {link.highlight && (
                    <PlusCircle className="w-3.5 h-3.5 text-amber-600 inline mr-1" />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Language Switcher & Auth */}
          <div className="hidden min-[1440px]:flex items-center space-x-3">
            {/* Language Switcher Pill */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:border-slate-400 transition"
              title="Toggle Language / भाषा बदला"
            >
              <Globe className="w-3.5 h-3.5 text-copper-600" />
              <span>{language === "mr" ? "English" : "मराठी"}</span>
            </button>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-2">
                {user.role === "ADMIN" ? (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-navy-900 text-white text-xs font-medium hover:bg-navy-800 transition shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.navAdmin}</span>
                  </Link>
                ) : (
                  <Link
                    href={
                      user.role === "ENUMERATOR"
                        ? "/admin/census"
                        : "/dashboard"
                    }
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{t.navDashboard}</span>
                  </Link>
                )}
                <button
                  disabled={logoutPending}
                  onClick={handleLogout}
                  className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                  title={t.navLogout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-navy-900 px-3 py-1.5"
                >
                  {t.navLogin}
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-semibold bg-navy-900 hover:bg-navy-800 text-white px-3.5 py-1.5 rounded-md transition shadow-sm"
                >
                  {t.navRegister}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-1 min-[1440px]:hidden shrink-0">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold text-slate-700"
            >
              <Globe className="w-3 h-3 text-copper-600" />
              <span>{language === "mr" ? "EN" : "मराठी"}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-700 hover:text-navy-900 hover:bg-slate-100"
              aria-label={
                language === "mr" ? "मेनू उघडा / बंद करा" : "Toggle menu"
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          id="mobile-navigation"
          className="min-[1440px]:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  link.highlight
                    ? "bg-amber-50 text-amber-900 border border-amber-300"
                    : isActive
                      ? "bg-slate-100 text-navy-900 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-slate-200 space-y-2">
            {user ? (
              <>
                <Link
                  href={
                    user.role === "ADMIN"
                      ? "/admin"
                      : user.role === "ENUMERATOR"
                        ? "/admin/census"
                        : "/dashboard"
                  }
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 rounded-md bg-navy-900 text-white font-medium"
                >
                  {user.role === "ADMIN" ? t.navAdmin : t.navDashboard}
                </Link>
                <button
                  disabled={logoutPending}
                  onClick={handleLogout}
                  className="block w-full text-center px-4 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 font-medium"
                >
                  {t.navLogout}
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2 rounded-md border border-slate-300 text-slate-800 font-medium text-sm"
                >
                  {t.navLogin}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2 rounded-md bg-navy-900 text-white font-medium text-sm"
                >
                  {t.navRegister}
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
