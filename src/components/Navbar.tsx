"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Menu, X, LogOut, Users, ArrowUpRight } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { useLanguage } from "./LanguageContext";
export default function Navbar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const mr = language === "mr";
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (active) setUser(data.authenticated ? data.user : null);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, [pathname]);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  const links = [
    { href: "/", mr: "मुख्यपृष्ठ", en: "Home" },
    { href: "/about", mr: "आपला समाज", en: "Our community" },
    { href: "/directory", mr: "उद्योजक", en: "Business Directory" },
    { href: "/resources", mr: "शिक्षण व साधने", en: "Resources" },
    { href: "/news", mr: "घडामोडी", en: "News & events" },
    { href: "/publications", mr: "प्रकाशने", en: "Publications" },
  ];
  const accountUrl =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "ENUMERATOR"
        ? "/admin/census"
        : "/dashboard";
  const logout = async () => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign out failed.");
      setPending(false);
    }
  };
  const active = (url: string) =>
    url === "/"
      ? pathname === url
      : pathname.startsWith(url) ||
        (url === "/about" &&
          ["/culture", "/initiatives", "/community"].some((value) =>
            pathname.startsWith(value),
          ));
  return (
    <header className="site-header">
      <div className="community-topbar">
        <span>
          {mr
            ? "आपल्या माणसांना जोडणारे समुदाय व्यासपीठ"
            : "A community platform connecting our people"}
        </span>
        <span className="topbar-utility">
          {mr
            ? "संस्कृती · उद्योजकता · नवी संधी"
            : "Heritage · Enterprise · Opportunity"}
          <Link href="/contact">{mr ? "संपर्क" : "Contact"}</Link>
          {!user && <Link href="/login">{mr ? "लॉगिन" : "Sign in"}</Link>}
        </span>
      </div>
      {error && (
        <div className="request-notice" role="alert">
          {error}
        </div>
      )}
      <div className="community-nav">
        <Link
          className="brand"
          href="/"
          aria-label={mr ? "आगरी समाज मुख्यपृष्ठ" : "Aagri Samaj home"}
        >
          <span className="brand-mark" aria-hidden="true">
            <Users size={23} />
          </span>
          <span>
            <span className="brand-name">
              {mr ? "आगरी समाज" : "Aagri Samaj"}
            </span>
            <span className="brand-subtitle">
              {mr ? "एकत्र. सक्षम. प्रगत." : "ROOTED. CONNECTED. FORWARD."}
            </span>
          </span>
        </Link>
        <nav
          className="desktop-links"
          aria-label={mr ? "मुख्य नेव्हिगेशन" : "Main navigation"}
        >
          {links.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              aria-current={active(link.href) ? "page" : undefined}
            >
              {mr ? link.mr : link.en}
            </Link>
          ))}
        </nav>
        <div className="desktop-auth nav-controls">
          <button
            className="language-control"
            onClick={() => setLanguage(mr ? "en" : "mr")}
            aria-label={mr ? "Switch to English" : "मराठीमध्ये बदला"}
          >
            <Globe size={15} />
            {mr ? "English" : "मराठी"}
          </button>
          {user ? (
            <>
              <Link className="button button-dark" href={accountUrl}>
                {user.role === "ADMIN" ? t.navAdmin : t.navDashboard}
              </Link>
              <button
                className="language-control"
                disabled={pending}
                onClick={logout}
                aria-label={t.navLogout}
              >
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <Link className="button button-dark" href="/register-business">
              {mr ? "व्यवसाय नोंदवा" : "Add your business"}
              <ArrowUpRight size={16} />
            </Link>
          )}
        </div>
        <div className="mobile-controls nav-controls">
          <button
            className="language-control"
            onClick={() => setLanguage(mr ? "en" : "mr")}
            aria-label={mr ? "Switch to English" : "मराठीमध्ये बदला"}
          >
            {mr ? "EN" : "मराठी"}
          </button>
          <button
            ref={toggle}
            className="language-control"
            aria-label={mr ? "मेनू उघडा / बंद करा" : "Toggle menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          className="mobile-community-nav"
          id="mobile-navigation"
          aria-label={mr ? "मोबाइल नेव्हिगेशन" : "Mobile navigation"}
        >
          {[
            ...links,
            {
              href: "/culture",
              mr: "संस्कृती व वारसा",
              en: "Culture & heritage",
            },
            { href: "/initiatives", mr: "उपक्रम", en: "Initiatives" },
            {
              href: "/register-business",
              mr: "व्यवसाय नोंदवा",
              en: "Register Business",
            },
            {
              href: "/advertise",
              mr: "जाहिरात व प्रायोजकत्व",
              en: "Advertising & Sponsorship",
            },
            { href: "/contact", mr: "संपर्क", en: "Contact" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {mr ? link.mr : link.en}
            </Link>
          ))}
          {user ? (
            <>
              <Link href={accountUrl}>
                {user.role === "ADMIN" ? t.navAdmin : t.navDashboard}
              </Link>
              <button
                className="button button-light"
                disabled={pending}
                onClick={logout}
              >
                {t.navLogout}
              </button>
            </>
          ) : (
            <>
              <Link href="/login">{t.navLogin}</Link>
              <Link href="/register">{t.navRegister}</Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
