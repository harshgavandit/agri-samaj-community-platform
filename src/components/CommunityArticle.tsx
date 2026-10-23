"use client";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, ArrowLeft, CalendarDays, Download } from "lucide-react";
import { CommunityEntry, kindLabels } from "@/lib/community";
import { useLanguage } from "./LanguageContext";
import ShareLink from "./ShareLink";
export default function CommunityArticle({ entry }: { entry: CommunityEntry }) {
  const { language } = useLanguage();
  const mr = language === "mr";
  const date = (value: string) =>
    new Intl.DateTimeFormat(mr ? "mr-IN" : "en-IN", {
      dateStyle: "medium",
      timeZone: "Asia/Kolkata",
    }).format(new Date(value));
  return (
    <article className="page-shell article-shell">
      <div className="article-topline">
        <Link
          href={
            ["EDUCATION", "RESOURCE"].includes(entry.kind)
              ? "/resources"
              : "/about"
          }
          className="back-link"
        >
          <ArrowLeft size={16} />
          {mr ? "समुदाय विभागात परत" : "Back to community"}
        </Link>
        <ShareLink path={`/community/${entry.slug}`} />
      </div>
      <header className="page-intro">
        <span className="eyebrow">
          {kindLabels[entry.kind][language]} ·{" "}
          {entry.period === "HISTORICAL"
            ? mr
              ? "ऐतिहासिक संदर्भ"
              : "Historical context"
            : mr
              ? "संदर्भांसह माहिती"
              : "Sourced information"}
        </span>
        <h1>{mr ? entry.titleMr : entry.titleEn}</h1>
        <p>{mr ? entry.summaryMr : entry.summaryEn}</p>
      </header>
      {entry.coverImageUrl && (
        <figure>
          <Image
            className="article-image"
            src={entry.coverImageUrl}
            width={1200}
            height={675}
            sizes="(max-width: 800px) 100vw, 900px"
            unoptimized={entry.coverImageUrl.startsWith("/api/files/")}
            alt={mr ? entry.titleMr : entry.titleEn}
          />
          <figcaption>{entry.coverCredit}</figcaption>
        </figure>
      )}
      {entry.period === "HISTORICAL" && (
        <p className="context-note">
          {mr
            ? "ही ऐतिहासिक नोंद आहे. या माहितीवरून आजची लोकसंख्या, व्यवसाय, प्रथा किंवा संस्थेचे चालू कामकाज गृहित धरू नये."
            : "This is a historical record. It does not establish current population, occupations, practices or an organization’s present activities."}
        </p>
      )}
      {entry.eventAt && (
        <div className="event-detail-panel">
          <p className="event-meta">
            <CalendarDays size={18} />
            {new Intl.DateTimeFormat(mr ? "mr-IN" : "en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Kolkata",
            }).format(new Date(entry.eventAt))}{" "}
            · {entry.location} ·{" "}
            {new Date(entry.eventAt) < new Date()
              ? mr
                ? "मागील कार्यक्रम"
                : "Past event"
              : mr
                ? "आगामी कार्यक्रम"
                : "Upcoming event"}
          </p>
          {entry.kind === "EVENT" && (
            <a
              className="quiet-action"
              href={`/api/community/${entry.slug}/calendar?language=${language}`}
            >
              <Download size={16} aria-hidden="true" />
              {mr ? "कॅलेंडरमध्ये जोडा" : "Add to calendar"}
            </a>
          )}
          <p className="studio-hint">
            {mr
              ? "वेळ भारतीय प्रमाणवेळेनुसार. उपस्थित राहण्यापूर्वी आयोजकांकडून तपशील निश्चित करा."
              : "Times use India Standard Time. Confirm details with the organizer before attending."}
          </p>
        </div>
      )}
      <div className="article-body">
        {(mr ? entry.bodyMr : entry.bodyEn)
          .split(/\n\s*\n/)
          .map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
      </div>
      {entry.actionUrl && (
        <a
          href={entry.actionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="button button-dark"
        >
          {mr ? "अधिकृत संकेतस्थळ पाहा" : "Visit the official website"}
          <ExternalLink size={17} />
          <span className="sr-only">
            {mr ? "नवीन टॅबमध्ये उघडेल" : "Opens in a new tab"}
          </span>
        </a>
      )}
      <section className="source-panel">
        <h2>{mr ? "संदर्भ आणि पुढील वाचन" : "Sources & further reading"}</h2>
        <ul>
          {entry.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.label}
                <ExternalLink size={15} />
              </a>
            </li>
          ))}
        </ul>
        {entry.verifiedAt && (
          <p>
            {mr ? "स्रोत तपासले:" : "Sources checked:"} {date(entry.verifiedAt)}
          </p>
        )}
        {(mr ? entry.sourceNoteMr : entry.sourceNoteEn) && (
          <p className="context-note">
            {mr ? entry.sourceNoteMr : entry.sourceNoteEn}
          </p>
        )}
        <p>
          {mr
            ? "बाह्य साधनांची पात्रता, शुल्क, उपलब्धता आणि अर्जाच्या मुदती संबंधित अधिकृत संस्थेकडून निश्चित करा."
            : "Confirm eligibility, fees, availability and application deadlines with the linked authority."}
        </p>
      </section>
      <Link
        className="back-link"
        href={`/contact?subject=${encodeURIComponent(`Correction: ${entry.titleEn}`)}`}
      >
        {mr
          ? "या माहितीमध्ये दुरुस्ती सुचवा"
          : "Suggest a correction to this information"}
        <ArrowLeft size={16} />
      </Link>
    </article>
  );
}
