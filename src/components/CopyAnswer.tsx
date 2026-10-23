"use client";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { AssistantSource } from "@/lib/assistant-contract";
import { useLanguage } from "./LanguageContext";

export default function CopyAnswer({
  answer,
  sources,
}: {
  answer: string;
  sources: AssistantSource[];
}) {
  const { language } = useLanguage();
  const mr = language === "mr";
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState("");
  async function copy() {
    const text = [
      answer,
      ...sources
        .filter(
          (source) =>
            source.url.startsWith("/") && !source.url.startsWith("//"),
        )
        .map(
          (source) =>
            `${source.title}: ${new URL(source.url, window.location.origin).href}`,
        ),
    ].join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFallback("");
    } catch {
      setFallback(text);
    }
  }
  return (
    <span className="inline-flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void copy()}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs hover:bg-amber-50"
      >
        {copied ? (
          <Check size={14} aria-hidden="true" />
        ) : (
          <Copy size={14} aria-hidden="true" />
        )}
        {copied
          ? mr
            ? "कॉपी केले"
            : "Copied"
          : mr
            ? "उत्तर कॉपी करा"
            : "Copy answer"}
      </button>
      {copied && (
        <span className="sr-only" role="status">
          {mr ? "उत्तर व स्रोत कॉपी केले." : "Answer and sources copied."}
        </span>
      )}
      {fallback && (
        <label className="mt-2 block w-full text-xs text-slate-700">
          {mr ? "हे उत्तर निवडून कॉपी करा" : "Select and copy this answer"}
          <textarea
            className="mt-1 w-full rounded border p-2"
            readOnly
            value={fallback}
            onFocus={(event) => event.target.select()}
            rows={4}
          />
        </label>
      )}
    </span>
  );
}
