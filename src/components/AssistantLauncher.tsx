"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "./LanguageContext";

const Assistant = dynamic(() => import("./CommunityAssistant"), { ssr: false });

export default function AssistantLauncher() {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="fixed bottom-5 right-4 sm:right-6 z-40 inline-flex items-center gap-2 rounded-full bg-navy-950 px-4 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-white/30 hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600"
      >
        <MessageCircle size={20} aria-hidden="true" />
        {language === "mr" ? "AI सहाय्यक" : "Ask AI"}
      </button>
      {open && <Assistant onClose={() => setOpen(false)} />}
    </>
  );
}
