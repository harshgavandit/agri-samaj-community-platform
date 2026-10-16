"use client";
import { apiFetch } from "@/lib/client-api";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageContext";

export default function AccessGate({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const [state, setState] = useState<
    "loading" | "allowed" | "login" | "forbidden" | "error"
  >("loading");
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const { language } = useLanguage();
  const roleKey = roles?.join(",") || "";
  const allowedRoles =
    pathname === "/admin/census" && roleKey === "ADMIN"
      ? "ADMIN,ENUMERATOR"
      : roleKey;
  useEffect(() => {
    let active = true;
    setState("loading");
    apiFetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (active)
          setState(
            !d.authenticated
              ? "login"
              : allowedRoles && !allowedRoles.split(",").includes(d.user.role)
                ? "forbidden"
                : "allowed",
          );
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [pathname, allowedRoles]);
  if (state === "allowed") return children;
  const returnTo = encodeURIComponent(pathname + (query ? `?${query}` : ""));
  return (
    <section className="max-w-xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-5">
      <h1 className="text-2xl font-bold">
        {state === "loading"
          ? language === "mr"
            ? "खाते तपासत आहे…"
            : "Checking your account…"
          : state === "login"
            ? language === "mr"
              ? "कृपया लॉगिन करा"
              : "Please sign in to continue"
            : state === "forbidden"
              ? language === "mr"
                ? "प्रवेश मर्यादित आहे"
                : "Access restricted"
              : language === "mr"
                ? "खाते तपासता आले नाही"
                : "Unable to check your account"}
      </h1>
      {state === "login" && (
        <>
          <p>
            {language === "mr"
              ? "आपले अर्ज, कागदपत्रे आणि मसुदे सुरक्षित ठेवण्यासाठी खाते आवश्यक आहे."
              : "An account keeps your applications, documents and saved drafts secure."}
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              className="rounded-lg bg-navy-950 text-white px-5 py-3"
              href={`/login?returnTo=${returnTo}`}
            >
              {language === "mr" ? "लॉगिन" : "Sign in"}
            </Link>
            <Link
              className="rounded-lg border px-5 py-3"
              href={`/register?returnTo=${returnTo}`}
            >
              {language === "mr" ? "खाते तयार करा" : "Create account"}
            </Link>
          </div>
        </>
      )}
      {state === "forbidden" && (
        <Link className="underline" href="/dashboard">
          {language === "mr" ? "माझे खाते" : "Go to your dashboard"}
        </Link>
      )}
      {state === "error" && (
        <button className="underline" onClick={() => window.location.reload()}>
          {language === "mr" ? "पुन्हा प्रयत्न करा" : "Try again"}
        </button>
      )}
    </section>
  );
}
