"use client";
import Feedback from "@/components/Feedback";
import { apiFetch } from "@/lib/client-api";

import BusinessCard from "@/components/BusinessCard";
import CategoryCard from "@/components/CategoryCard";
import { useLanguage } from "@/components/LanguageContext";
import { localizeLocation } from "@/lib/localize";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  Compass,
  MapPin,
  Megaphone,
  PlusCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [requestError, setRequestError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, busRes, pubRes, annRes] = await Promise.all([
          apiFetch("/api/categories").then((r) => r.json()),
          apiFetch("/api/businesses?limit=6").then((r) => r.json()),
          apiFetch("/api/publications").then((r) => r.json()),
          apiFetch("/api/announcements").then((r) => r.json()),
        ]);

        if (catRes.categories) setCategories(catRes.categories);
        if (busRes.businesses) setFeaturedBusinesses(busRes.businesses);
        if (pubRes.publications) setPublications(pubRes.publications);
        if (annRes.announcements) setAnnouncements(annRes.announcements);
      } catch (err) {
        setRequestError(
          err instanceof Error
            ? err.message
            : "Unable to complete the request.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/directory?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/directory");
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <Feedback message={requestError} />
      {/* 1. Hero Section */}
      <section className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white overflow-hidden py-14 sm:py-20 border-b-4 border-amber-500">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-5">
          <div className="inline-flex items-center space-x-2 bg-navy-800/80 border border-amber-500/40 px-3.5 py-1 rounded-full text-xs text-amber-300 backdrop-blur">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {language === "mr"
                ? "अखिल आगरी समाज परिषद • नोंदणीकृत ट्रस्ट व सोसा. १९९३"
                : "Akhil Aagri Samaj Parishad • Registered Trust & Society 1993"}
            </span>
          </div>

          <div className="max-w-4xl mx-auto space-y-2 sm:space-y-3">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-devanagari">
              {t.heroHeadline}
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
              {t.heroSubheadline}
            </p>
          </div>

          {/* Quick Search Bar */}
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-1.5 sm:p-2 rounded-xl shadow-xl flex flex-col sm:flex-row items-center gap-2 border border-slate-200"
            >
              <div className="relative flex-grow w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  aria-label={t.searchPlaceholder}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm text-navy-950 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center space-x-1.5 shrink-0 shadow-md"
              >
                <span>{t.ctaExploreBusinesses}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <Link
              href="/register-business"
              className="inline-flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs sm:text-sm px-4 py-2 rounded-lg transition shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.ctaRegisterBusiness}</span>
            </Link>
            <Link
              href="/directory"
              className="inline-flex items-center space-x-1.5 bg-navy-800/90 hover:bg-navy-700 text-white border border-slate-700 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>{t.navDirectory}</span>
            </Link>
            <Link
              href="/advertise"
              className="inline-flex items-center space-x-1.5 bg-navy-800/90 hover:bg-navy-700 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span>{t.ctaAdvertiseNow}</span>
            </Link>
          </div>
        </div>
      </section>

      {loading && (
        <p role="status" className="text-center text-sm text-slate-600">
          {language === "mr"
            ? "समुदायाची माहिती लोड होत आहे…"
            : "Loading community information…"}
        </p>
      )}
      {/* 2. Community & Organization Introduction */}
      <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-3">
            <div className="inline-block px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded text-xs font-semibold">
              {language === "mr"
                ? "संस्थेची पार्श्वभूमी व उद्दिष्ट"
                : "Institutional Background & Mission"}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
              {language === "mr"
                ? "अखिल आगरी समाज परिषद - ३०+ वर्षांची सामाजिक व आर्थिक परंपरा"
                : "Akhil Aagri Samaj Parishad - 30+ Years of Socio-Economic Unity"}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              {language === "mr"
                ? '१९९३ मध्ये स्थापन झालेल्या अखिल आगरी समाज परिषदेने समाजातील उद्योजकांना एकत्र आणण्यासाठी २००६ व २०१२ मध्ये ऐतिहासिक "आगरी उद्योजक पुस्तिका" प्रकाशित केली. आजच्या डिजिटल युगात हेच उद्दिष्ट पुढे नेत, सर्व क्षेत्रांतील उद्योजक, व्यावसायिक व सेवा पुरवठादारांना एकाच छत्राखाली आणण्यासाठी हे डिजिटल पोर्टल समर्पित आहे.'
                : "Founded in 1993, Akhil Aagri Samaj Parishad published historic print directories in 2006 and 2012 to connect community entrepreneurs. In this digital era, this portal serves as the comprehensive online successor, connecting manufacturers, traders, tech innovators, and legal experts under one trusted umbrella."}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/initiatives"
                className="inline-flex items-center text-xs sm:text-sm font-bold text-amber-800 hover:text-amber-950 space-x-1"
              >
                <span>
                  {language === "mr"
                    ? "उपक्रमांचा इतिहास वाचा"
                    : "Read History & Initiatives"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-xl space-y-2.5">
            <h3 className="font-bold text-navy-950 text-xs sm:text-sm">
              {language === "mr" ? "परिषदेची प्रमुख अंगे" : "Core Focus Areas"}
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>
                    {language === "mr"
                      ? "आगरी उद्योजक विभाग:"
                      : "Agri Entrepreneur Wing:"}
                  </strong>{" "}
                  {language === "mr"
                    ? "व्यावसायिक समन्वय व B2B नेटवर्किंग"
                    : "Business networking & B2B commerce"}
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>
                    {language === "mr"
                      ? "मासिक आगरी दर्पण:"
                      : "Monthly Agri Darpan:"}
                  </strong>{" "}
                  {language === "mr"
                    ? "अधिकृत विचारमंथन व जनजागरण मुखपत्र"
                    : "Official community journal & newsletter"}
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>
                    {language === "mr"
                      ? "जनगणना व संशोधन:"
                      : "Census & Research:"}
                  </strong>{" "}
                  {language === "mr"
                    ? "सामाजिक व आर्थिक अभ्यास मोहीम"
                    : "Socio-economic survey & research campaign"}
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>
                    {language === "mr"
                      ? "युवा कौशल्य मार्गदर्शन:"
                      : "Youth Incubation & Guidance:"}
                  </strong>{" "}
                  {language === "mr"
                    ? "नवउद्योजक मार्गदर्शन व रोजगार"
                    : "Startup mentorship & employment guidance"}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Industry Categories Grid */}
      <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
              {t.sectionCategoriesTitle}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
              {t.sectionCategoriesSubtitle}
            </p>
          </div>
          <Link
            href="/directory"
            className="text-xs sm:text-sm font-semibold text-amber-700 hover:text-amber-800 flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>
              {language === "mr" ? "सर्व शाखा पहा" : "View All Sectors"}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* 4. Recently Approved / Featured Entrepreneur Profiles */}
      <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
              {t.sectionFeaturedTitle}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
              {t.sectionFeaturedSubtitle}
            </p>
          </div>
          <Link
            href="/directory"
            className="text-xs sm:text-sm font-semibold text-amber-700 hover:text-amber-800 flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>
              {language === "mr"
                ? "संपूर्ण डिरेक्टरी शोधा"
                : "Browse Full Directory"}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {featuredBusinesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredBusinesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-600 text-xs sm:text-sm">
              {language === "mr"
                ? "नोंदणी प्रक्रिया सुरू आहे. लवकरच नवीन उद्योजक जोडले जातील."
                : "Registration in progress. Verified listings will appear here."}
            </p>
          </div>
        )}
      </section>

      {/* 5. Why Register Your Business (Value Proposition) */}
      <section className="bg-navy-900 text-white py-8 border-y border-navy-800">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {t.sectionWhyRegisterTitle}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              {t.sectionWhyRegisterSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-navy-950 p-4 sm:p-5 rounded-xl border border-navy-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                {language === "mr" ? "१" : "1"}
              </div>
              <h3 className="text-base font-bold text-white">
                {t.benefit1Title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.benefit1Desc}
              </p>
            </div>

            <div className="bg-navy-950 p-4 sm:p-5 rounded-xl border border-navy-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                {language === "mr" ? "२" : "2"}
              </div>
              <h3 className="text-base font-bold text-white">
                {t.benefit2Title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.benefit2Desc}
              </p>
            </div>

            <div className="bg-navy-950 p-4 sm:p-5 rounded-xl border border-navy-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                {language === "mr" ? "३" : "3"}
              </div>
              <h3 className="text-base font-bold text-white">
                {t.benefit3Title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.benefit3Desc}
              </p>
            </div>
          </div>

          <div className="text-center pt-1">
            <Link
              href="/register-business"
              className="inline-flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold px-5 py-2.5 rounded-lg transition shadow-md text-xs sm:text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.ctaRegisterBusiness}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Digital Publications & Archives (PDF References) */}
      <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
              {t.sectionPubsTitle}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
              {t.sectionPubsSubtitle}
            </p>
          </div>
          <Link
            href="/publications"
            className="text-xs sm:text-sm font-semibold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
          >
            <span>
              {language === "mr" ? "सर्व प्रकाशने पहा" : "View All Archives"}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {publications.map((pub) => (
            <div
              key={pub.id}
              className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-[11px]">
                    {pub.editionType === "DIRECTORY"
                      ? language === "mr"
                        ? "उद्योजक डिरेक्टरी"
                        : "Business Directory"
                      : language === "mr"
                        ? "मासिक मुखपत्र"
                        : "Monthly Journal"}
                  </span>
                  <span className="font-semibold text-amber-800 text-[11px]">
                    {language === "mr"
                      ? `वर्ष ${pub.editionYear}`
                      : `Edition ${pub.editionYear}`}
                  </span>
                </div>
                <h3 className="font-bold text-navy-950 text-sm sm:text-base">
                  {language === "mr" ? pub.titleMr : pub.titleEn}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3">
                  {language === "mr" ? pub.descriptionMr : pub.descriptionEn}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/publications"
                  className="text-xs font-semibold text-amber-700 hover:text-amber-900 inline-flex items-center space-x-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {language === "mr"
                      ? "तपशील व डिजिटल प्रत"
                      : "Digital Archive Preview"}
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Community Announcements & Upcoming Events */}
      {announcements.length > 0 && (
        <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-xl sm:text-2xl font-bold text-navy-950 mb-0.5">
              {language === "mr"
                ? "परिषदेच्या महत्त्वाच्या घोषणा व मेळावे"
                : "Official Announcements & Summits"}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mb-4">
              {language === "mr"
                ? "आगामी बैठका, व्यापार प्रदर्शने व मार्गदर्शन शिबिरे"
                : "Upcoming conferences, summits and B2B meets"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2"
                >
                  <div className="flex items-center space-x-2 text-xs text-amber-700 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {ann.eventDate
                        ? new Date(ann.eventDate).toLocaleDateString(
                            language === "mr" ? "mr-IN" : "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : language === "mr"
                          ? "नियोजित"
                          : "Scheduled"}
                    </span>
                    <span>•</span>
                    <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                      {ann.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-navy-950">
                    {language === "mr" ? ann.titleMr : ann.titleEn}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === "mr" ? ann.contentMr : ann.contentEn}
                  </p>
                  {ann.location && (
                    <div className="flex items-center space-x-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-copper-600 shrink-0" />
                      <span>{localizeLocation(ann.location, language)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Advertising Banner / Call to Action */}
      <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-copper-700 rounded-2xl p-5 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {t.sectionAdsTitle}
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm leading-relaxed">
              {t.sectionAdsSubtitle} -{" "}
              {language === "mr"
                ? "डिजिटल डिरेक्टरी, वेब पोर्टल व आगामी छापील पुस्तिकेत आपल्या व्यवसायाची रंगीत जाहिरात द्या."
                : "Book prime multi-color cover spots or digital banners across our community directory."}
            </p>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/advertise"
              className="bg-navy-950 hover:bg-navy-900 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg transition text-center shadow"
            >
              {t.ctaAdvertiseNow}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
