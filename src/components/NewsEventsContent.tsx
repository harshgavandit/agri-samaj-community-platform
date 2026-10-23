"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  ArrowRight,
  Download,
  Search,
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { apiFetch } from "@/lib/client-api";
import type { PublicUpdatesPage } from "@/lib/public-data";
import { communityUpdates, sortCommunityUpdates } from "@/lib/community-events";
import ShareLink from "./ShareLink";

export default function NewsEventsContent({
  initialData,
  initialError = "",
  initialFilter = "all",
  initialQuery = "",
  initialPage = 1,
  initialNow,
}: {
  initialData?: PublicUpdatesPage;
  initialError?: string;
  initialFilter?: string;
  initialQuery?: string;
  initialPage?: number;
  initialNow?: number;
}) {
  const { language } = useLanguage();
  const mr = language === "mr";
  const searchParams = useSearchParams();
  const requestedFilter = searchParams.get("period") || "all";
  const filter = ["all", "upcoming", "past"].includes(requestedFilter)
    ? requestedFilter
    : "all";
  const query = (searchParams.get("q") || "").slice(0, 200).trim();
  const requestedPage = Number(searchParams.get("page") || 1);
  const page = Number.isInteger(requestedPage)
    ? Math.min(100000, Math.max(1, requestedPage))
    : 1;
  const key = JSON.stringify([filter, query, page]);
  const initialKey = JSON.stringify([initialFilter, initialQuery, initialPage]);
  const initialRequest = useRef(true);
  const requestVersion = useRef(0);
  const [items, setItems] = useState(() =>
    initialData ? communityUpdates(initialData) : [],
  );
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [pagination, setPagination] = useState(
    initialData?.pagination || {
      page: initialPage,
      limit: 12,
      total: 0,
      totalPages: 0,
    },
  );
  const [resultKey, setResultKey] = useState(initialKey);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [now] = useState(() => initialNow || Date.now());
  useEffect(() => {
    setDraftQuery(query);
  }, [query]);
  useEffect(() => {
    if (initialRequest.current && key === initialKey && retry === 0) {
      initialRequest.current = false;
      return;
    }
    initialRequest.current = false;
    const controller = new AbortController();
    const version = ++requestVersion.current;
    setError("");
    setLoading(true);
    const params = new URLSearchParams({
      q: query,
      period: filter,
      page: String(page),
      limit: "12",
    });
    apiFetch(`/api/updates?${params}`, { signal: controller.signal })
      .then((response): Promise<PublicUpdatesPage> => response.json())
      .then((updates) => {
        if (!controller.signal.aborted && version === requestVersion.current) {
          setItems(communityUpdates(updates));
          setPagination(updates.pagination);
          setResultKey(key);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && version === requestVersion.current) {
          setError(error.message);
          setResultKey(key);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted && version === requestVersion.current)
          setLoading(false);
      });
    return () => controller.abort();
  }, [retry, key, initialKey, query, filter, page]);
  const visible = useMemo(
    // The server searches full content before pagination. Filtering excerpts
    // again here would hide valid matches that occur only in the article body.
    () => sortCommunityUpdates(items, filter, "", now),
    [items, filter, now],
  );
  const updateView = (
    nextFilter: string,
    nextQuery: string,
    nextPage = 1,
    push = false,
  ) => {
    const params = new URLSearchParams();
    if (nextFilter !== "all") params.set("period", nextFilter);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextPage > 1) params.set("page", String(nextPage));
    window.history[push ? "pushState" : "replaceState"](
      null,
      "",
      "/news" + (params.size ? "?" + params.toString() : ""),
    );
  };
  useEffect(() => {
    if (draftQuery.trim() === query) return;
    const timer = setTimeout(
      () => updateView(filter, draftQuery.slice(0, 200)),
      350,
    );
    return () => clearTimeout(timer);
  }, [draftQuery, query, filter]);
  const pending = loading || resultKey !== key;
  const date = (value: string) =>
    new Intl.DateTimeFormat(mr ? "mr-IN" : "en-IN", {
      dateStyle: "long",
      timeZone: "Asia/Kolkata",
    }).format(new Date(value));
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
            ? "बातम्या, कार्यक्रम आणि भेटीगाठी—आपल्या समाजाशी जोडलेले राहा. उपस्थित राहण्यापूर्वी आयोजकांकडून चालू तपशील निश्चित करा."
            : "News, events and opportunities to come together. Discover what’s happening and confirm current details with the organizer before attending."}
        </p>
      </header>
      <div className="news-toolbar">
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
              type="button"
              key={value}
              aria-pressed={filter === value}
              onClick={() => updateView(value, draftQuery)}
            >
              {mr ? a : b}
            </button>
          ))}
        </div>
        <span className="event-count" role="status">
          {pending
            ? mr
              ? "माहिती मिळवत आहोत…"
              : "Loading updates…"
            : `${pagination.total} ${mr ? "घडामोडी" : "updates"}`}
        </span>
      </div>
      <div className="library-toolbar">
        <label className="search-field">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">
            {mr ? "बातम्या व कार्यक्रम शोधा" : "Search news and events"}
          </span>
          <input
            type="search"
            value={draftQuery}
            maxLength={200}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder={
              mr
                ? "कार्यक्रम, विषय किंवा ठिकाण शोधा…"
                : "Search an event, topic or location…"
            }
          />
        </label>
        <Link
          className="quiet-action"
          href="/contact?subject=Event%20suggestion"
        >
          {mr ? "कार्यक्रम सुचवा" : "Suggest an event"}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      {pending ? (
        <div className="loading-card" role="status">
          {mr ? "माहिती मिळवत आहोत…" : "Loading updates…"}
        </div>
      ) : error ? (
        <div className="empty-state" role="alert">
          <h2>
            {mr ? "घडामोडी मिळू शकल्या नाहीत" : "Updates could not be loaded"}
          </h2>
          <p>{error}</p>
          <button
            type="button"
            className="button button-dark"
            onClick={() => setRetry((previous) => previous + 1)}
          >
            {mr ? "पुन्हा प्रयत्न करा" : "Try again"}
          </button>
        </div>
      ) : visible.length ? (
        <div className="news-list">
          {visible.map((item) => (
            <article
              className="news-card"
              key={item.id}
              id={`update-${item.id}`}
            >
              <div className="news-card-header">
                {item.date ? (
                  <div className="event-date-block" aria-hidden="true">
                    <strong>
                      {new Intl.DateTimeFormat(mr ? "mr-IN" : "en-IN", {
                        day: "numeric",
                        timeZone: "Asia/Kolkata",
                      }).format(new Date(item.date))}
                    </strong>
                    <span>
                      {new Intl.DateTimeFormat(mr ? "mr-IN" : "en-IN", {
                        month: "short",
                        timeZone: "Asia/Kolkata",
                      }).format(new Date(item.date))}
                    </span>
                  </div>
                ) : (
                  <div className="event-date-block" aria-hidden="true">
                    <CalendarDays size={25} />
                  </div>
                )}
                <div>
                  <div className="card-kicker">
                    <span>
                      {item.date
                        ? date(item.date)
                        : mr
                          ? "समुदाय बातमी"
                          : "Community update"}
                    </span>
                    {item.date && (
                      <span className="history-label">
                        {new Date(item.date).getTime() < now
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
                      <MapPin size={16} aria-hidden="true" />
                      {item.location}
                    </p>
                  )}
                </div>
              </div>
              <p className="news-body">{mr ? item.bodyMr : item.bodyEn}</p>
              {!item.slug && (
                <p className="context-note">
                  {mr
                    ? "या सूचनेसाठी आयोजकाचा स्रोत जोडलेला नाही. उपस्थित राहण्यापूर्वी तारीख, ठिकाण व नोंदणीचे चालू तपशील निश्चित करा."
                    : "An organizer source is not attached to this announcement. Confirm the current date, venue and registration details before participating."}
                </p>
              )}
              <div className="news-actions">
                {item.slug && (
                  <Link className="text-link" href={`/community/${item.slug}`}>
                    {mr
                      ? "संपूर्ण माहिती व स्रोत"
                      : "Full information & sources"}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                )}
                {item.calendar && (
                  <a
                    className="quiet-action"
                    href={`/api/community/${item.slug}/calendar?language=${language}`}
                  >
                    <Download size={16} aria-hidden="true" />
                    {mr ? "कॅलेंडरमध्ये जोडा" : "Add to calendar"}
                  </a>
                )}
                <ShareLink
                  path={
                    item.slug
                      ? `/community/${item.slug}`
                      : `/news#update-${item.id}`
                  }
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <CalendarDays size={36} aria-hidden="true" />
          <h2>
            {mr
              ? "या विभागात प्रकाशित नोंद नाही"
              : "No published updates in this view"}
          </h2>
          <p>
            {mr
              ? "दुसरा शोध किंवा कालावधी निवडा. तुमचा कार्यक्रम तारीख, ठिकाण आणि आयोजकाच्या संदर्भासह सुचवू शकता."
              : "Try another search or period. You can suggest an event with its date, location and organizer reference."}
          </p>
          <button
            type="button"
            className="button button-light"
            onClick={() => updateView("all", "")}
          >
            {mr ? "सर्व घडामोडी पाहा" : "View all updates"}
          </button>
        </div>
      )}
      {!pending && !error && pagination.total > 0 && (
        <nav
          className="mt-7 flex flex-wrap items-center justify-between gap-4"
          aria-label={mr ? "घडामोडी पृष्ठे" : "Updates pagination"}
        >
          <p className="text-sm text-slate-600" role="status">
            {mr
              ? `पृष्ठ ${page} / ${Math.max(1, pagination.totalPages)} · ${pagination.total} पैकी या पृष्ठावर ${visible.length} घडामोडी`
              : `Page ${page} of ${Math.max(1, pagination.totalPages)} · ${visible.length} shown here, ${pagination.total} updates in total`}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className="quiet-action"
              disabled={page <= 1}
              onClick={() => updateView(filter, query, page - 1, true)}
            >
              {mr ? "मागील" : "Previous"}
            </button>
            <button
              type="button"
              className="quiet-action"
              disabled={page >= pagination.totalPages}
              onClick={() => updateView(filter, query, page + 1, true)}
            >
              {mr ? "पुढील" : "Next"}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
