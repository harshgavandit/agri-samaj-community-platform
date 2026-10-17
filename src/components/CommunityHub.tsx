"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { CommunityEntry, ContentKind, kindLabels } from "@/lib/community";
import { useLanguage } from "./LanguageContext";
import CommunityCard from "./CommunityCard";
const sections = {
  about: {
    mr: "आपला समाज, आपली ओळख.",
    en: "A shared identity. A living community.",
    descMr:
      "भाषा, इतिहास, संस्था आणि आजच्या पिढीच्या आकांक्षा—विश्वसनीय संदर्भांमधून जाणून घ्या.",
    descEn:
      "Explore our language, historical context, organizations and aspirations through carefully sourced information.",
    kinds: ["ABOUT", "ORGANIZATION", "ACHIEVEMENT"],
  },
  culture: {
    mr: "आपला वारसा, पुढच्या पिढीसाठी.",
    en: "Our heritage, for the next generation.",
    descMr:
      "आगरी बोली आणि किनारपट्टीच्या जीवनाचा वारसा जाणून घ्या. जुन्या नोंदींचा काळ आणि संदर्भ स्पष्टपणे दिलेला आहे.",
    descEn:
      "Discover Aagri speech and the heritage of coastal life. Historical records are presented with their dates and context.",
    kinds: ["CULTURE"],
  },
  resources: {
    mr: "शिकण्यासाठी. घडण्यासाठी. पुढे जाण्यासाठी.",
    en: "Learn. Build. Take your next step.",
    descMr:
      "शिष्यवृत्ती, करिअर, कौशल्य आणि उद्योजकतेसाठी अधिकृत साधने एकाच ठिकाणी. पात्रता व मुदती संबंधित अधिकृत संकेतस्थळावर तपासा.",
    descEn:
      "Official resources for scholarships, careers, skills and enterprise, in one place. Check eligibility and dates with the responsible authority.",
    kinds: ["EDUCATION", "RESOURCE", "ORGANIZATION"],
  },
  initiatives: {
    mr: "माहितीतून सहभागाकडे.",
    en: "From information to participation.",
    descMr:
      "समाजासाठी उपलब्ध सार्वजनिक साधने आणि प्रकाशित उपक्रम जाणून घ्या. जुन्या कार्यक्रमांना चालू उपक्रम समजू नका.",
    descEn:
      "Find published initiatives and public resources. Historical programs are distinguished from current opportunities.",
    kinds: ["INITIATIVE", "ORGANIZATION", "ACHIEVEMENT"],
  },
} as const;
export default function CommunityHub({
  section,
}: {
  section: keyof typeof sections;
}) {
  const { language } = useLanguage();
  const mr = language === "mr";
  const config = sections[section];
  const [entries, setEntries] = useState<CommunityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiFetch("/api/community", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setEntries(data.entries))
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);
  const filtered = entries.filter(
    (entry) =>
      (config.kinds as readonly string[]).includes(entry.kind) &&
      (!kind || entry.kind === kind) &&
      (!query ||
        [entry.titleMr, entry.titleEn, entry.summaryMr, entry.summaryEn]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase())),
  );
  return (
    <div className="page-shell">
      <div className="breadcrumb">
        <Link href="/">{mr ? "मुख्यपृष्ठ" : "Home"}</Link>
        <span>/</span>
        {mr ? "समुदाय" : "Community"}
      </div>
      <header className="page-intro">
        <span className="eyebrow">
          {mr ? "आगरी समाज · एकत्र, पुढे" : "AAGRI SAMAJ · FORWARD, TOGETHER"}
        </span>
        <h1>{config[language]}</h1>
        <p>{mr ? config.descMr : config.descEn}</p>
      </header>
      <nav
        className="section-tabs"
        aria-label={mr ? "समुदाय विभाग" : "Community sections"}
      >
        {[
          ["/about", "आपला समाज", "Our community"],
          ["/culture", "संस्कृती", "Culture"],
          ["/resources", "शिक्षण व साधने", "Education & resources"],
          ["/initiatives", "उपक्रम", "Initiatives"],
          ["/news", "बातम्या व कार्यक्रम", "News & events"],
        ].map(([url, a, b]) => (
          <Link
            key={url}
            href={url}
            aria-current={url === `/${section}` ? "page" : undefined}
          >
            {mr ? a : b}
          </Link>
        ))}
      </nav>
      <div className="library-toolbar">
        <label className="search-field">
          <Search size={19} />
          <span className="sr-only">
            {mr ? "साधने शोधा" : "Search community resources"}
          </span>
          <input
            type="search"
            value={query}
            maxLength={200}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mr
                ? "विषय, अभ्यासक्रम किंवा साधन शोधा…"
                : "Search a topic, course or resource…"
            }
          />
        </label>
        <label>
          <span className="sr-only">{mr ? "विषय" : "Topic"}</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">{mr ? "सर्व विषय" : "All topics"}</option>
            {config.kinds.map((value) => (
              <option value={value} key={value}>
                {kindLabels[value as ContentKind][language]}
              </option>
            ))}
          </select>
        </label>
        <span className="result-count" role="status" aria-live="polite">
          {loading
            ? mr
              ? "माहिती मिळवत आहोत…"
              : "Loading resources…"
            : `${filtered.length} ${mr ? "नोंदी" : "entries"}`}
        </span>
      </div>
      {error ? (
        <div className="empty-state" role="alert">
          <h2>
            {mr
              ? "माहिती मिळू शकली नाही"
              : "We could not load this information"}
          </h2>
          <p>{error}</p>
          <button
            className="button button-dark"
            onClick={() => setAttempt(attempt + 1)}
          >
            {mr ? "पुन्हा प्रयत्न करा" : "Try again"}
          </button>
        </div>
      ) : loading ? (
        <div className="content-grid" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div className="loading-card" key={i} />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="content-grid">
          {filtered.map((entry) => (
            <CommunityCard entry={entry} key={entry.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>
            {mr
              ? "तुमच्या शोधासाठी नोंद सापडली नाही"
              : "No entries match your search"}
          </h2>
          <p>
            {mr
              ? "दुसरा शब्द वापरा किंवा सर्व विषय पाहा. नवी माहिती स्रोतासह सुचवण्यासाठी आमच्याशी संपर्क साधा."
              : "Try another term or view all topics. Suggest new information with a supporting source through our contact form."}
          </p>
          <button
            className="button button-light"
            onClick={() => {
              setKind("");
              setQuery("");
            }}
          >
            {mr ? "शोध साफ करा" : "Clear search"}
          </button>
        </div>
      )}
      <aside className="contribution-strip">
        <div>
          <h2>
            {mr
              ? "आपल्या समाजाची गोष्ट पुढे आणा."
              : "Help tell our community’s story."}
          </h2>
          <p>
            {mr
              ? "यशोगाथा, लोककला, परंपरा किंवा उपक्रम—माहिती, स्रोत आणि प्रकाशनाची परवानगी पाठवा. पडताळणीनंतरच माहिती प्रकाशित होते."
              : "Share an achievement, art form, tradition or initiative with sources and publication permission. Information is reviewed before publication."}
          </p>
        </div>
        <Link className="button button-dark" href="/contact">
          {mr ? "माहिती सुचवा" : "Suggest a contribution"}
          <ArrowRight size={17} />
        </Link>
      </aside>
    </div>
  );
}
