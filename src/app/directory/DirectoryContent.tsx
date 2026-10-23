"use client";

import BusinessCard from "@/components/BusinessCard";
import Feedback from "@/components/Feedback";
import { useLanguage } from "@/components/LanguageContext";
import {
  useBusinessShortlist,
  type DirectoryBusiness,
} from "@/components/useBusinessShortlist";
import { apiFetch } from "@/lib/client-api";
import {
  DIRECTORY_CLASSIFICATIONS,
  DIRECTORY_DISTRICTS,
  directoryHref,
  directoryQuery,
  emptyDirectoryFilters,
  parseDirectoryFilters,
  type DirectoryFilters,
} from "@/lib/directory-filters";
import { localizeLocation } from "@/lib/localize";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Compass,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import styles from "./Directory.module.css";

interface Category {
  id: string;
  slug: string;
  nameMr: string;
  nameEn: string;
}

interface DirectoryResult {
  businesses: DirectoryBusiness[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

interface DirectoryProps {
  initialCategories: Category[];
  initialResult: DirectoryResult | null;
  initialQuery: string;
}

function DirectoryContent({
  initialCategories,
  initialResult,
  initialQuery,
}: DirectoryProps) {
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const mr = language === "mr";
  const filters = useMemo(
    () => parseDirectoryFilters(searchParams),
    [searchParams],
  );
  const [search, setSearch] = useState(filters.q);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [businesses, setBusinesses] = useState<DirectoryBusiness[]>(
    initialResult?.businesses || [],
  );
  const [pagination, setPagination] = useState(
    initialResult?.pagination || {
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 12,
    },
  );
  const [loading, setLoading] = useState(!initialResult);
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [shareError, setShareError] = useState("");
  const [reload, setReload] = useState(0);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const results = useRef<HTMLDivElement>(null);
  const firstRequest = useRef(true);
  const shortlist = useBusinessShortlist();

  const navigate = (changes: Partial<DirectoryFilters>, replace = false) => {
    const next = {
      ...parseDirectoryFilters(new URLSearchParams(window.location.search)),
      ...changes,
    };
    const href = directoryHref(next);
    if (href === window.location.pathname + window.location.search) return;
    window.history[replace ? "replaceState" : "pushState"](null, "", href);
  };

  useEffect(() => {
    setSearch(filters.q);
  }, [filters.q]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== filters.q)
        navigate({ q: search.trim(), page: 1 }, true);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, filters.q]);
  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (initialCategories.length) return;
    const controller = new AbortController();
    apiFetch("/api/categories", { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (!controller.signal.aborted) setCategories(data.categories || []);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setCategoryError(
            cause instanceof Error
              ? cause.message
              : "Unable to load categories.",
          );
      });
    return () => controller.abort();
  }, [initialCategories.length]);

  useEffect(() => {
    const query = directoryQuery(filters).toString();
    if (firstRequest.current) {
      firstRequest.current = false;
      if (initialResult && query === initialQuery) return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const params = directoryQuery(filters);
    params.set("limit", "12");
    apiFetch(`/api/businesses?${params}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        setBusinesses(data.businesses);
        setPagination(data.pagination);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setBusinesses([]);
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load the directory.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters, reload, initialResult, initialQuery]);

  const clear = () => {
    setSearch("");
    navigate(emptyDirectoryFilters);
  };
  const share = async () => {
    setShareError("");
    try {
      await navigator.clipboard.writeText(
        window.location.origin + directoryHref(filters),
      );
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareError(
        mr
          ? "लिंक कॉपी करता आली नाही. ब्राउझरमधील पत्ता कॉपी करा."
          : "Unable to copy. You can share the address in your browser.",
      );
    }
  };
  const classificationLabels: Record<string, string> = {
    MANUFACTURER: t.classificationManufacturer,
    TRADER: t.classificationTrader,
    CONTRACTOR: t.classificationContractor,
    PROFESSIONAL: t.classificationProfessional,
    OTHER: mr ? "इतर" : "Other",
  };
  const selectedCategory = categories.find(
    (item) => item.slug === filters.category || item.id === filters.category,
  );
  const chips = [
    filters.q && { key: "q", text: filters.q },
    filters.category && {
      key: "category",
      text: selectedCategory
        ? mr
          ? selectedCategory.nameMr
          : selectedCategory.nameEn
        : filters.category,
    },
    filters.district && {
      key: "district",
      text: localizeLocation(filters.district, language),
    },
    filters.classification && {
      key: "classification",
      text: classificationLabels[filters.classification],
    },
  ].filter(Boolean) as {
    key: "q" | "category" | "district" | "classification";
    text: string;
  }[];
  const changePage = (page: number) => {
    navigate({ page });
    results.current?.scrollIntoView({ behavior: "instant", block: "start" });
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>
            <Compass size={15} aria-hidden="true" />
            {mr ? "आपल्या माणसांचे व्यवसाय" : "Discover community enterprise"}
          </div>
          <h1>{t.directoryTitle}</h1>
          <p>
            {mr
              ? "आपल्या परिसरातील उद्योजक, सेवा आणि कौशल्ये शोधा. योग्य व्यवसाय निवडा आणि समाजातील नव्या संधींना जोडले जा."
              : "Discover the people, skills and services in our community. Find the right business, make a connection, and help local enterprise grow."}
          </p>
        </div>
        <aside className={styles.heroAside}>
          <Link href="/dashboard#saved-businesses">
            <Bookmark size={16} aria-hidden="true" />
            {mr ? "आपली जतन केलेली व्यवसाय यादी" : "Your saved businesses"}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <p>
            {mr
              ? "पुन्हा संपर्क करण्यासाठी व्यवसाय जतन करा. लॉगिन केल्यावर आपली यादी कोणत्याही डिव्हाइसवर उपलब्ध होते."
              : "Keep useful contacts close. Sign in to save a private shortlist and access it across your devices."}
          </p>
        </aside>
      </header>
      <section
        className={styles.searchPanel}
        aria-label={
          mr ? "व्यवसाय शोध व फिल्टर" : "Search and filter businesses"
        }
      >
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              aria-label={t.searchPlaceholder}
              maxLength={200}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.searchPlaceholder}
            />
          </div>
          <button type="button" onClick={share} className={styles.share}>
            {copied ? (
              <Check size={17} aria-hidden="true" />
            ) : (
              <Share2 size={17} aria-hidden="true" />
            )}
            <span>
              {copied
                ? mr
                  ? "लिंक कॉपी झाली"
                  : "Link copied"
                : mr
                  ? "शोध शेअर करा"
                  : "Share results"}
            </span>
          </button>
        </div>
        <div className={styles.filterGrid}>
          <div className={styles.field}>
            <label htmlFor="directory-category">
              {mr ? "व्यवसाय क्षेत्र" : "Category"}
            </label>
            <select
              id="directory-category"
              aria-label="Category"
              value={filters.category}
              onChange={(event) =>
                navigate({ category: event.target.value, page: 1 })
              }
            >
              <option value="">{t.allCategories}</option>
              {filters.category && !selectedCategory && (
                <option value={filters.category}>{filters.category}</option>
              )}
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {mr ? category.nameMr : category.nameEn}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="directory-district">
              {mr ? "जिल्हा" : "District"}
            </label>
            <select
              id="directory-district"
              aria-label="District"
              value={filters.district}
              onChange={(event) =>
                navigate({ district: event.target.value, page: 1 })
              }
            >
              <option value="">{t.allDistricts}</option>
              {filters.district &&
                !DIRECTORY_DISTRICTS.some(
                  (district) => district === filters.district,
                ) && (
                  <option value={filters.district}>
                    {localizeLocation(filters.district, language)}
                  </option>
                )}
              {DIRECTORY_DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {localizeLocation(district, language)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="directory-type">
              {mr ? "व्यवसाय प्रकार" : "Business type"}
            </label>
            <select
              id="directory-type"
              aria-label="Classification"
              value={filters.classification}
              onChange={(event) =>
                navigate({ classification: event.target.value, page: 1 })
              }
            >
              <option value="">
                {mr ? "सर्व व्यवसाय प्रकार" : "All Business Types"}
              </option>
              {DIRECTORY_CLASSIFICATIONS.map((classification) => (
                <option value={classification} key={classification}>
                  {classificationLabels[classification]}
                </option>
              ))}
            </select>
          </div>
        </div>
        {categoryError && <Feedback message={categoryError} />}
        {chips.length > 0 && (
          <div className={styles.chips}>
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className={styles.chip}
                aria-label={`${mr ? "फिल्टर काढा" : "Remove filter"}: ${chip.text}`}
                onClick={() => {
                  if (chip.key === "q") setSearch("");
                  navigate({ [chip.key]: "", page: 1 });
                }}
              >
                <span>{chip.text}</span>
                <X size={13} aria-hidden="true" />
              </button>
            ))}
            <button type="button" className={styles.reset} onClick={clear}>
              {t.ctaClear}
            </button>
          </div>
        )}
      </section>
      <Feedback message={shortlist.error} />
      {shortlist.error && (
        <button
          type="button"
          className={styles.reset}
          onClick={shortlist.retry}
        >
          {mr ? "जतन केलेली यादी पुन्हा लोड करा" : "Reload saved businesses"}
        </button>
      )}
      <Feedback message={shareError} />
      <div
        className={styles.resultsBar}
        ref={results}
        style={{ scrollMarginTop: "110px" }}
      >
        <div>
          <p className={styles.resultsTitle} role="status" aria-live="polite">
            {loading
              ? mr
                ? "व्यवसाय शोधत आहोत…"
                : "Finding businesses…"
              : `${pagination.total} ${mr ? "व्यवसाय आढळले" : "businesses found"}`}
          </p>
          <p className={styles.resultsNote}>
            {mr
              ? "प्रशासक-मंजूर नोंदी · विनामूल्य शोध"
              : "Administrator-approved listings · Free to explore"}
          </p>
        </div>
        <label className={styles.sortLabel}>
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span>{mr ? "क्रमवारी" : "Sort by"}</span>
          <select
            aria-label={mr ? "क्रमवारी" : "Sort by"}
            value={filters.sort}
            onChange={(event) =>
              navigate({
                sort: event.target.value as DirectoryFilters["sort"],
                page: 1,
              })
            }
          >
            <option value="recent">{mr ? "नवीन प्रथम" : "Newest first"}</option>
            <option value="name">
              {mr ? "व्यवसायाच्या नावानुसार" : "Business name"}
            </option>
            <option value="oldest">{mr ? "जुने प्रथम" : "Oldest first"}</option>
          </select>
        </label>
      </div>
      {error ? (
        <div className={styles.empty} role="alert">
          <Search size={36} aria-hidden="true" />
          <h2>
            {mr
              ? "शोध पूर्ण करता आला नाही"
              : "We couldn’t complete your search"}
          </h2>
          <p>{error}</p>
          <button
            type="button"
            className={styles.action}
            onClick={() => setReload((value) => value + 1)}
          >
            {mr ? "पुन्हा प्रयत्न करा" : "Try again"}
          </button>
        </div>
      ) : loading ? (
        <div className={styles.grid} aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className={styles.skeleton}>
              <div />
              <div />
              <div />
              <div />
            </div>
          ))}
        </div>
      ) : businesses.length ? (
        <>
          <div className={styles.grid}>
            {businesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                saved={shortlist.savedIds.has(business.id)}
                savePending={shortlist.pendingIds.has(business.id)}
                saveDisabled={
                  shortlist.loading || shortlist.authenticated === null
                }
                onSave={shortlist.toggle}
              />
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <nav
              className={styles.pagination}
              aria-label={mr ? "व्यवसाय शोधाची पाने" : "Directory pages"}
            >
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() => changePage(filters.page - 1)}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                {mr ? "मागील" : "Previous"}
              </button>
              <span aria-current="page">
                {filters.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={filters.page >= pagination.totalPages}
                onClick={() => changePage(filters.page + 1)}
              >
                {mr ? "पुढील" : "Next"}
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className={styles.empty}>
          <Search size={36} aria-hidden="true" />
          <h2>{t.noResultsFound}</h2>
          <p>
            {mr
              ? "या निकषांशी जुळणारे व्यवसाय आढळले नाहीत. दुसरा शब्द शोधा किंवा काही फिल्टर काढा."
              : "No businesses match these filters yet. Try a broader service, another location, or remove a filter."}
          </p>
          {filters.page > 1 ? (
            <button
              type="button"
              className={styles.action}
              onClick={() => changePage(1)}
            >
              {mr ? "पहिल्या पानावर जा" : "Go to first page"}
            </button>
          ) : (
            <button type="button" className={styles.action} onClick={clear}>
              {t.ctaClear}
            </button>
          )}
        </div>
      )}
      <p className={styles.trust}>
        <ShieldCheck size={17} aria-hidden="true" />
        <span>
          {mr
            ? "मंजुरी म्हणजे नोंद मंचाच्या प्रशासकाने तपासली आहे; ती शासकीय किंवा व्यावसायिक प्रमाणपत्र नाही. व्यवहारापूर्वी सेवा, परवाने आणि अटी व्यवसायाकडून थेट पडताळा."
            : "Approval means a listing was reviewed by a platform administrator. It is not government or professional certification. Confirm services, credentials and terms with the business before making a commitment."}
        </span>
      </p>
      <div className="sr-only" role="status" aria-live="polite">
        {copied ? (mr ? "शोधाची लिंक कॉपी झाली" : "Search link copied") : ""}
      </div>
    </div>
  );
}

export default function DirectoryClient(props: DirectoryProps) {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center" role="status">
          Loading directory…
        </div>
      }
    >
      <DirectoryContent {...props} />
    </Suspense>
  );
}
