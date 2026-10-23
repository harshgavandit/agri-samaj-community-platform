"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Compass,
  GraduationCap,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  MapPin,
  Building2,
  CheckCircle2,
  FileCheck2,
  Bookmark,
} from "lucide-react";
import BusinessCard from "@/components/BusinessCard";
import CommunityCard from "@/components/CommunityCard";
import CommunityFAQ from "@/components/CommunityFAQ";
import { useLanguage } from "@/components/LanguageContext";
import { apiFetch } from "@/lib/client-api";
import { CommunityEntry, defaultSettings } from "@/lib/community";
import type { PublicHomeSnapshot } from "@/lib/public-data";
import { DIRECTORY_DISTRICTS } from "@/lib/directory-filters";
import { localizeLocation } from "@/lib/localize";
export default function HomePageContent({
  initialData,
  initialError = "",
}: {
  initialData?: PublicHomeSnapshot;
  initialError?: string;
}) {
  const { language, t } = useLanguage();
  const mr = language === "mr";
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(!initialData && !initialError);
  const [error, setError] = useState(initialError);
  const [businesses, setBusinesses] = useState<
    PublicHomeSnapshot["businesses"]
  >(initialData?.businesses || []);
  const [categories, setCategories] = useState<
    PublicHomeSnapshot["categories"]
  >(initialData?.categories || []);
  const [entries, setEntries] = useState<CommunityEntry[]>(
    initialData?.entries || [],
  );
  const [announcements, setAnnouncements] = useState<
    PublicHomeSnapshot["announcements"]
  >(initialData?.announcements || []);
  const [settings, setSettings] = useState(
    initialData?.settings || defaultSettings,
  );
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (retry === 0) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.allSettled(
      [
        "/api/businesses?limit=3",
        "/api/categories",
        "/api/community",
        "/api/announcements",
      ].map((url) =>
        apiFetch(url, { signal: controller.signal }).then((r) => r.json()),
      ),
    ).then((results) => {
      if (controller.signal.aborted) return;
      if (results[0].status === "fulfilled")
        setBusinesses(results[0].value.businesses);
      if (results[1].status === "fulfilled")
        setCategories(results[1].value.categories);
      if (results[2].status === "fulfilled") {
        setEntries(results[2].value.entries);
        setSettings(results[2].value.settings);
      }
      if (results[3].status === "fulfilled")
        setAnnouncements(results[3].value.announcements);
      if (results.some((result) => result.status === "rejected"))
        setError(
          mr
            ? "काही माहिती मिळू शकली नाही. कृपया पुन्हा प्रयत्न करा."
            : "Some information could not be loaded. Please try again.",
        );
      setLoading(false);
    });
    return () => controller.abort();
    // The request is independent of the selected display language.
  }, [retry]);
  const resources = entries
    .filter((entry) => ["EDUCATION", "RESOURCE"].includes(entry.kind))
    .slice(0, 3);
  const stories = entries
    .filter((entry) =>
      ["CULTURE", "ABOUT", "ORGANIZATION"].includes(entry.kind),
    )
    .slice(0, 3);
  const notice = mr ? settings.noticeMr : settings.noticeEn;
  return (
    <div className="home-page">
      {notice && (
        <div className="site-notice" role="status">
          {notice}
        </div>
      )}
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="status-dot" />
            {mr ? "आगरी समाज · एकत्र, पुढे" : "AAGRI SAMAJ · FORWARD, TOGETHER"}
          </span>
          <h1>{mr ? settings.heroTitleMr : settings.heroTitleEn}</h1>
          <p>{mr ? settings.heroDescriptionMr : settings.heroDescriptionEn}</p>
          <form
            className="hero-discovery"
            onSubmit={(event) => {
              event.preventDefault();
              const params = new URLSearchParams();
              if (query.trim()) params.set("q", query.trim());
              if (district) params.set("district", district);
              router.push(
                "/directory" + (params.size ? "?" + params.toString() : ""),
              );
            }}
          >
            <div className="hero-search-fields">
              <label htmlFor="home-business-search">
                <Search size={20} aria-hidden="true" />
                <span className="sr-only">{t.searchPlaceholder}</span>
                <input
                  id="home-business-search"
                  value={query}
                  maxLength={200}
                  onChange={(event) => setQuery(event.target.value)}
                  type="search"
                  placeholder={
                    mr
                      ? "व्यवसाय किंवा सेवा शोधा…"
                      : "What service are you looking for?"
                  }
                />
              </label>
              <label htmlFor="home-business-district">
                <MapPin size={18} aria-hidden="true" />
                <span className="sr-only">{mr ? "जिल्हा" : "District"}</span>
                <select
                  id="home-business-district"
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                >
                  <option value="">
                    {mr ? "सर्व जिल्हे" : "All districts"}
                  </option>
                  {DIRECTORY_DISTRICTS.map((value) => (
                    <option key={value} value={value}>
                      {localizeLocation(value, language)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button className="button button-dark" type="submit">
              {mr ? "व्यवसाय शोधा" : "Search businesses"}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="hero-actions">
            <Link href="/directory" className="button button-light">
              {mr ? "डिरेक्टरी पाहा" : "Browse the directory"}
              <ArrowUpRight size={18} />
            </Link>
            <Link href="/about" className="text-link">
              {mr ? "आपला समाज जाणून घ्या" : "Meet our community"}
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-values">
            <span>
              <ShieldCheck size={16} />
              {mr ? "पडताळणीनंतर प्रकाशन" : "Reviewed before publishing"}
            </span>
            <span>
              <Users size={16} />
              {mr ? "सर्व पिढ्यांसाठी" : "For every generation"}
            </span>
          </div>
          <div className="hero-footnote">
            <span className="hero-footnote-line" />
            {mr
              ? "आपली बोली. आपला वारसा. एकमेकांना नवी साथ."
              : "Local roots. Shared knowledge. A stronger community."}
          </div>
        </div>
        <div className="heritage-art" aria-hidden="true">
          <div className="art-label">
            आगरी <span>SAMAJ</span>
          </div>
          <div className="art-orbit" />
          <div className="art-arch">
            <svg viewBox="0 0 480 510" fill="none">
              <circle cx="310" cy="128" r="57" fill="#f4c06f" />
              <path
                d="M-30 283C72 208 126 221 228 280C316 331 388 282 510 244V530H-30Z"
                fill="#a7b9ae"
              />
              <path
                d="M-30 337C90 278 168 300 258 344C351 389 409 340 510 325V530H-30Z"
                fill="#45675d"
              />
              <path
                d="M-30 404C116 352 183 385 264 418C348 451 413 400 510 389V530H-30Z"
                fill="#183e3b"
              />
              <path d="M55 340H183L165 356H77Z" fill="#f9f2e3" />
              <path
                d="M119 267V339M119 267L163 323H119Z"
                stroke="#f9f2e3"
                strokeWidth="3"
              />
              <path
                d="M35 460H136M275 371H360M190 476H320"
                stroke="#9caf9f"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M49 142Q65 123 81 142M81 142Q97 123 113 142"
                stroke="#284d46"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <div className="art-caption">
              <span>आपली माणसं.</span>
              <strong>आपली प्रगती.</strong>
            </div>
          </div>
          <div className="art-note">
            <Sparkles size={18} />
            <span>
              {mr
                ? "मुळांशी नातं. भविष्याशी मैत्री."
                : "Honouring our roots. Opening new paths."}
            </span>
          </div>
          <span className="art-edition">
            HERITAGE / ENTERPRISE / OPPORTUNITY
          </span>
        </div>
      </section>
      <div
        className="community-promises"
        aria-label={mr ? "व्यासपीठाची वैशिष्ट्ये" : "Platform features"}
      >
        {[
          [Users, mr ? "सर्व पिढ्यांना जोडणारे" : "Built for every generation"],
          [
            CheckCircle2,
            mr
              ? "तपासणीनंतर प्रसिद्ध नोंदी"
              : "Listings reviewed before publication",
          ],
          [
            BookOpen,
            mr ? "स्रोतांसह समुदाय माहिती" : "Community knowledge with sources",
          ],
          [
            Bookmark,
            mr ? "उपयुक्त व्यवसाय जतन करा" : "Save businesses for later",
          ],
        ].map(([Icon, label], index) => {
          const FeatureIcon = Icon as typeof Users;
          return (
            <span key={index}>
              <FeatureIcon size={18} aria-hidden="true" />
              {label as string}
            </span>
          );
        })}
      </div>
      <div className="page-shell home-content">
        {error && (
          <div role="alert" className="request-notice">
            <span>{error}</span>
            <button onClick={() => setRetry(retry + 1)}>
              {mr ? "पुन्हा प्रयत्न करा" : "Try again"}
            </button>
          </div>
        )}
        <section
          className="explore-grid"
          aria-label={mr ? "समुदाय विभाग" : "Explore the community"}
        >
          {[
            {
              href: "/culture",
              icon: Compass,
              mr: "आपली संस्कृती",
              en: "Our culture",
              dm: "बोली, इतिहास आणि किनारपट्टीचा वारसा",
              de: "Language, history and our coastal heritage",
            },
            {
              href: "/resources",
              icon: GraduationCap,
              mr: "शिक्षण व करिअर",
              en: "Learning & careers",
              dm: "शिष्यवृत्ती, कौशल्य आणि नव्या संधी",
              de: "Scholarships, skills and your next opportunity",
            },
            {
              href: "/news",
              icon: CalendarDays,
              mr: "समाजातील घडामोडी",
              en: "Community updates",
              dm: "प्रकाशित बातम्या, कार्यक्रम व उपक्रम",
              de: "Published news, events and initiatives",
            },
          ].map((item) => (
            <Link href={item.href} key={item.href}>
              <item.icon size={26} />
              <div>
                <h2>{mr ? item.mr : item.en}</h2>
                <p>{mr ? item.dm : item.de}</p>
              </div>
              <ArrowUpRight size={20} />
            </Link>
          ))}
        </section>
        <section
          className="participation-section home-section"
          aria-labelledby="participation-title"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {mr ? "सुरुवात तुमच्यापासून" : "A PLACE TO START"}
              </span>
              <h2 id="participation-title">
                {mr
                  ? "तुमच्यासाठी पुढची पायरी."
                  : "Find your place in the community."}
              </h2>
              <p>
                {mr
                  ? "व्यवसाय असो, नवीन संधींचा शोध असो किंवा आपली संस्कृती—उपयुक्त पुढचे पाऊल निवडा."
                  : "Whether you run a business, are planning your next step or want to explore our heritage, start with what matters to you."}
              </p>
            </div>
          </div>
          <div className="participation-grid">
            {[
              {
                icon: Building2,
                labelMr: "उद्योजकांसाठी",
                labelEn: "For business owners",
                titleMr: "आपला व्यवसाय पुढे आणा.",
                titleEn: "Let your community find you.",
                detailMr:
                  "अर्जाचा मसुदा जतन करा, कागदपत्रे जोडा आणि तपासणीची स्थिती पाहा.",
                detailEn:
                  "Save your application, add supporting documents and follow its review from your dashboard.",
                href: "/register-business",
                actionMr: "व्यवसाय नोंदवा",
                actionEn: "Register your business",
              },
              {
                icon: GraduationCap,
                labelMr: "विद्यार्थी व तरुणांसाठी",
                labelEn: "For students & learners",
                titleMr: "संधींची योग्य दिशा शोधा.",
                titleEn: "A clearer path to your next step.",
                detailMr:
                  "शिष्यवृत्ती, कौशल्य आणि करिअरसाठी अधिकृत साधने एकाच ठिकाणी.",
                detailEn:
                  "Explore official scholarship, skills and career resources, with the original sources close at hand.",
                href: "/resources",
                actionMr: "साधने पाहा",
                actionEn: "Find useful resources",
              },
              {
                icon: FileCheck2,
                labelMr: "समाजासाठी योगदान",
                labelEn: "For contributors",
                titleMr: "आपली गोष्ट पुढे आणा.",
                titleEn: "Keep our shared story growing.",
                detailMr:
                  "स्रोतासह परंपरा, यशोगाथा किंवा कार्यक्रम सुचवा. प्रकाशित होण्यापूर्वी तपासणी होते.",
                detailEn:
                  "Suggest an event, tradition or achievement with a source. Contributions are reviewed before publication.",
                href: "/contact?subject=Community%20contribution",
                actionMr: "माहिती सुचवा",
                actionEn: "Suggest a contribution",
              },
            ].map((item) => (
              <article key={item.href} className="participation-card">
                <span className="participation-icon">
                  <item.icon size={23} aria-hidden="true" />
                </span>
                <span className="eyebrow">
                  {mr ? item.labelMr : item.labelEn}
                </span>
                <h3>{mr ? item.titleMr : item.titleEn}</h3>
                <p>{mr ? item.detailMr : item.detailEn}</p>
                <Link href={item.href} className="text-link">
                  {mr ? item.actionMr : item.actionEn}
                  <ArrowRight size={17} />
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section className="home-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {mr ? "उद्योजकतेला आपली साथ" : "SUPPORT LOCAL ENTERPRISE"}
              </span>
              <h2>
                {mr
                  ? "आपल्या माणसांचे व्यवसाय."
                  : "Local people. Remarkable businesses."}
              </h2>
              <p>
                {mr
                  ? "उत्पादन, तंत्रज्ञान, व्यापार आणि सेवांमधील प्रशासक-मंजूर नोंदी शोधा."
                  : "Discover administrator-approved listings across manufacturing, technology, trade and services."}
              </p>
            </div>
            <Link className="text-link" href="/directory">
              {mr ? "संपूर्ण डिरेक्टरी" : "Explore the directory"}
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="category-chips">
            {categories.slice(0, 6).map((category) => (
              <Link
                href={
                  "/directory?category=" + encodeURIComponent(category.slug)
                }
                key={category.id}
              >
                {mr ? category.nameMr : category.nameEn}
                <ArrowUpRight size={13} />
              </Link>
            ))}
          </div>
          {loading ? (
            <div className="content-grid" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div key={i} className="loading-card" />
              ))}
            </div>
          ) : businesses.length ? (
            <div className="content-grid">
              {businesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>
                {mr
                  ? "तुमचा व्यवसाय समाजापर्यंत पोहोचवा."
                  : "Bring your business to the community."}
              </h3>
              <p>
                {mr
                  ? "प्रकाशित व्यवसाय नोंदी उपलब्ध झाल्यावर येथे दिसतील. तुमचा अर्ज जतन करा, पूर्ण करा आणि तपासणीसाठी पाठवा."
                  : "Published businesses will appear here as listings are approved. Save your application, complete it and submit it for review."}
              </p>
              <Link href="/register-business" className="button button-dark">
                {mr ? "व्यवसाय नोंदवा" : "Register your business"}
                <ArrowRight size={17} />
              </Link>
            </div>
          )}
        </section>
        <section className="home-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {mr ? "ओळख जपूया, माहिती वाढवूया" : "KNOW OUR ROOTS"}
              </span>
              <h2>
                {mr ? "आपली ओळख. अनेक पैलू." : "One community. Many stories."}
              </h2>
              <p>
                {mr
                  ? "स्रोतांसह समुदायाची माहिती आणि ऐतिहासिक संदर्भ."
                  : "Sourced community information and historical context, thoughtfully presented."}
              </p>
            </div>
            <Link className="text-link" href="/culture">
              {mr ? "वारसा जाणून घ्या" : "Explore our heritage"}
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="content-grid">
            {stories.map((entry) => (
              <CommunityCard entry={entry} key={entry.id} />
            ))}
          </div>
        </section>
        <section className="resource-feature">
          <div className="resource-intro">
            <GraduationCap size={36} />
            <span className="eyebrow">
              {mr ? "संधींच्या नव्या वाटा" : "MAKE YOUR NEXT MOVE"}
            </span>
            <h2>
              {mr
                ? "तुमच्या उद्याला\nनवी दिशा."
                : "A little guidance.\nA world of possibility."}
            </h2>
            <p>
              {mr
                ? "अधिकृत शैक्षणिक, रोजगार आणि कौशल्य साधनांमधून तुमच्यासाठी योग्य पुढची पायरी शोधा."
                : "Find your next step through official education, employment and skills resources."}
            </p>
            <Link href="/resources" className="button button-light">
              {mr ? "सर्व साधने पाहा" : "Explore all resources"}
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="resource-list">
            {resources.map((entry) => (
              <Link key={entry.id} href={"/community/" + entry.slug}>
                <span>{mr ? entry.titleMr : entry.titleEn}</span>
                <p>{mr ? entry.summaryMr : entry.summaryEn}</p>
                <ArrowUpRight size={20} />
              </Link>
            ))}
            {!loading && !resources.length && (
              <p>
                {mr
                  ? "अधिकृत साधनांसाठी समुदाय विभाग पाहा किंवा संपर्क साधा."
                  : "Explore the community resources section or contact us for guidance."}
              </p>
            )}
          </div>
        </section>
        <section className="updates-row">
          <div>
            <span className="eyebrow">
              {mr ? "समाजाशी जोडलेले राहा" : "STAY CONNECTED"}
            </span>
            <h2>
              {mr
                ? "घडामोडी आणि उपक्रम."
                : "What’s happening in our community."}
            </h2>
            <Link href="/news" className="text-link">
              {mr ? "सर्व बातम्या व कार्यक्रम" : "All news & events"}
              <ArrowRight size={18} />
            </Link>
            <p className="mt-4 text-sm text-[#5c6964]">
              {mr
                ? "प्रकाशित सूचना: नियोजन करण्यापूर्वी कार्यक्रमाचे चालू तपशील आयोजकांकडून निश्चित करा."
                : "Published notices: confirm current event details with the organizer before making plans."}
            </p>
          </div>
          <div>
            {announcements.length ? (
              announcements.slice(0, 3).map((item) => (
                <Link href="/news" className="update-item" key={item.id}>
                  <CalendarDays size={22} />
                  <div>
                    <span>{mr ? item.titleMr : item.titleEn}</span>
                    {item.eventDate && (
                      <small>
                        {new Intl.DateTimeFormat(mr ? "mr-IN" : "en-IN", {
                          dateStyle: "medium",
                          timeZone: "Asia/Kolkata",
                        }).format(new Date(item.eventDate))}
                        {new Date(item.eventDate) < new Date()
                          ? mr
                            ? " · मागील कार्यक्रम"
                            : " · Past event"
                          : ""}
                      </small>
                    )}
                  </div>
                  <ArrowUpRight size={18} />
                </Link>
              ))
            ) : (
              <div className="source-panel">
                <h3>
                  {mr
                    ? "समाजासाठी काही आयोजित करत आहात?"
                    : "Planning something for the community?"}
                </h3>
                <p>
                  {mr
                    ? "कार्यक्रमाची तारीख, ठिकाण आणि आयोजकाचा संदर्भ पाठवा. पडताळणीनंतर तपशील प्रकाशित करता येतील."
                    : "Send the event date, location and an organizer reference. Details can be published after review."}
                </p>
                <Link href="/contact" className="text-link">
                  {mr ? "कार्यक्रम सुचवा" : "Suggest an event"}
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </section>
        <Link href="/publications" className="archive-banner">
          <BookOpen size={35} />
          <div>
            <span className="eyebrow">
              {mr ? "डिजिटल वाचनालय" : "THE DIGITAL READING ROOM"}
            </span>
            <h2>
              {mr
                ? "आजही उपयोगी. उद्यासाठी जतन."
                : "Useful today. Preserved for tomorrow."}
            </h2>
            <p>
              {mr
                ? "प्रकाशित डिरेक्टरी, दस्तऐवज आणि समाजाची प्रकाशने पाहा."
                : "Explore published directories, documents and community publications."}
            </p>
          </div>
          <ArrowUpRight size={26} />
        </Link>
        <CommunityFAQ />
        <section className="contribution-strip">
          <div>
            <span className="eyebrow">
              {mr ? "तुमचा सहभाग महत्त्वाचा" : "YOU BELONG HERE"}
            </span>
            <h2>
              {mr
                ? "एकमेकांच्या प्रगतीची साथ बनूया."
                : "Let’s help each other move forward."}
            </h2>
            <p>
              {mr
                ? "तुमचा व्यवसाय नोंदवा, उपयुक्त माहिती सुचवा किंवा तुमचा अभिप्राय कळवा."
                : "Register your business, suggest a useful resource or share your feedback."}
            </p>
          </div>
          <Link className="button button-dark" href="/contact">
            {mr ? "आमच्याशी जोडा" : "Get in touch"}
            <ArrowRight size={18} />
          </Link>
        </section>
      </div>
    </div>
  );
}
