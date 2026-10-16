"use client";

import { Language, translations } from "@/lib/translations";
import React, { createContext, useContext, useEffect, useState } from "react";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (typeof translations)["mr"];
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("mr"); // Marathi default

  useEffect(() => {
    // Check localStorage for user preference
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("agri_samaj_lang");
    } catch {}
    if (saved === "mr" || saved === "en") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("agri_samaj_lang", lang);
    } catch {}
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
