"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { apiFetch } from "@/lib/client-api";
import { CommunityEntry } from "@/lib/community";
export default function NewsEvents() {
  const { language } = useLanguage();
  const mr = language === "mr";
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setLoading(true);
    Promise.all([
      apiFetch("/api/announcements", { signal: controller.signal }).then((r) =>
        r.json(),
      ),
      apiFetch("/api/community", { signal: controller.signal }).then((r) =>
        r.json(),
      ),
    ])
      .then(([a, c]) => {
        setItems([
          ...a.announcements.map((item: any) => ({
            ...item,
            date: item.eventDate,
            bodyMr: item.contentMr,
            bodyEn: item.contentEn,
          })),
          ...c.entries
            .filter((item: CommunityEntry) =>
              ["EVENT", "NEWS", "INITIATIVE"].includes(item.kind),
            )
            .map((item: CommunityEntry) => ({
              ...item,
              date: item.eventAt,
              category: item.kind,
              bodyMr: item.summaryMr,
              bodyEn: item.summaryEn,
            })),
        ]);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);
  const visible = items
    .filter(
      (item) =>
        filter === "all" ||
        (filter === "upcoming"
          ? item.date && new Date(item.date) >= new Date()
          : item.date && new Date(item.date) < new Date()),
    )
    .sort(
      (a, b) =>
        new Date(b.date || b.createdAt || b.updatedAt).getTime() -
        new Date(a.date || a.createdAt || a.updatedAt).getTime(),
    );
  return (
    <div className="page-shell">
      <div className="breadcrumb">
        <Link href="/">{mr ? "मुख्यपृष्ठ" : "Home"}</Link>
        <span>/</span>
        {mr ? "घडामोडी" : "Updates"}
      </div>
      <header className="page-intro">
        <span className="eyebrow">
          {mr ? "जोडलेले राहा · सहभागी व्हा" : "STAY CONNECTED · GET INVOLVED"}
        </span>
        <h1>
          {mr ? "आपल्या समाजातील घडामोडी." : "The latest from our community."}
        </h1>
        <p>
          {mr
            ? "प्रकाशित बातम्या, कार्यक्रमांच्या सूचना आणि मागील उपक्रमांचे संदर्भ. सहभागी होण्यापूर्वी चालू तपशील आयोजकांकडून निश्चित करा."
            : "Published news, event notices and references to past initiatives. Confirm current details with the organizer before participating."}
        </p>
      </header>
      <div
        className="filter-pills"
        role="group"
        aria-label={mr ? "कार्यक्रम कालावधी" : "Event period"}
      >
        {[
          ["all", "सर्व घडामोडी", "All updates"],
          ["upcoming", "आगामी कार्यक्रम", "Upcoming events"],
          ["past", "मागील कार्यक्रम", "Past events"],
        ].map(([value, a, b]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {mr ? a : b}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="loading-card" role="status">
          {mr ? "माहिती मिळवत आहोत…" : "Loading updates…"}
        </div>
      ) : error ? (
        <div className="empty-state" role="alert">
          <p>{error}</p>
          <button
            className="button button-dark"
            onClick={() => setRetry(retry + 1)}
          >
            {mr ? "पुन्हा प्रयत्न करा" : "Try again"}
          </button>
        </div>
      ) : visible.length ? (
        <div className="news-list">
          {visible.map((item) => (
            <article className="news-card" key={item.id}>
              <div className="card-kicker">
                <CalendarDays size={17} />
                <span>
                  {item.date
                    ? new Intl.DateTimeFormat(mr ? "mr-IN" : "en-IN", {
                        dateStyle: "long",
                        timeZone: "Asia/Kolkata",
                      }).format(new Date(item.date))
                    : mr
                      ? "समुदाय बातमी"
                      : "Community update"}
                </span>
                {item.date && (
                  <span className="history-label">
                    {new Date(item.date) < new Date()
                      ? mr
                        ? "मागील"
                        : "Past"
                      : mr
                        ? "आगामी"
                        : "Upcoming"}
                  </span>
                )}
              </div>
              <h2>{mr ? item.titleMr : item.titleEn}</h2>
              {item.location && (
                <p className="event-meta">
                  <MapPin size={16} />
                  {item.location}
                </p>
              )}
              <p className="news-body">{mr ? item.bodyMr : item.bodyEn}</p>
              {!item.kind && (
                <p className="context-note">
                  {mr
                    ? "या सूचनेसाठी आयोजकाचा स्रोत जोडलेला नाही. सहभागी होण्यापूर्वी तारीख, ठिकाण व नोंदणीचे चालू तपशील निश्चित करा."
                    : "An organizer source is not attached to this announcement. Confirm the current date, venue and registration details before participating."}
                </p>
              )}
              {item.kind && (
                <Link href={"/community/" + item.slug} className="text-link">
                  {mr ? "संपूर्ण माहिती व स्रोत" : "Full information & sources"}
                  <ArrowRight size={16} />
                </Link>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <CalendarDays size={36} />
          <h2>
            {mr
              ? "या विभागात प्रकाशित नोंद नाही"
              : "No published updates in this view"}
          </h2>
          <p>
            {mr
              ? "कार्यक्रमाची नोंद प्रसिद्ध झाल्यावर येथे दिसेल. तारीख, ठिकाण आणि आयोजकाच्या संदर्भासह कार्यक्रम सुचवू शकता."
              : "Published updates will appear here. Suggest an event with its date, location and organizer reference."}
          </p>
          <Link href="/contact" className="button button-dark">
            {mr ? "कार्यक्रम सुचवा" : "Suggest an event"}
            <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </div>
  );
}
