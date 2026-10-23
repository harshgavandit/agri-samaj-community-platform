"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export default function ShareLink({
  path,
  label,
}: {
  path: string;
  label?: string;
}) {
  const { language } = useLanguage();
  const mr = language === "mr";
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const [manual, setManual] = useState("");
  async function copy() {
    const url = new URL(path, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setManual("");
    } catch {
      setStatus("error");
      setManual(url);
    }
  }
  return (
    <span className="share-control">
      <button
        type="button"
        className="quiet-action"
        onClick={() => void copy()}
      >
        {status === "copied" ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Copy size={16} aria-hidden="true" />
        )}
        {status === "copied"
          ? mr
            ? "दुवा कॉपी केला"
            : "Link copied"
          : label || (mr ? "दुवा कॉपी करा" : "Copy link")}
      </button>
      <span className="sr-only" role="status">
        {status === "error"
          ? mr
            ? "खालील दुवा निवडून कॉपी करा."
            : "Select and copy the link below."
          : ""}
      </span>
      {manual && (
        <input
          aria-label={mr ? "कॉपी करण्यासाठी दुवा" : "Link to copy"}
          className="manual-share-link"
          value={manual}
          readOnly
          onFocus={(event) => event.target.select()}
        />
      )}
    </span>
  );
}
