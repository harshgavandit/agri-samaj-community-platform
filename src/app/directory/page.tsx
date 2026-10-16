"use client";
import Feedback from "@/components/Feedback";
import { apiFetch } from "@/lib/client-api";

import BusinessCard from "@/components/BusinessCard";
import { useLanguage } from "@/components/LanguageContext";
import { AlertCircle, RefreshCw, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function DirectoryContent() {
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const [requestError, setRequestError] = useState("");

  const [categories, setCategories] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "",
  );
  const [selectedDistrict, setSelectedDistrict] = useState(
    searchParams.get("district") || "",
  );
  const [selectedClassification, setSelectedClassification] = useState(
    searchParams.get("classification") || "",
  );
  const [page, setPage] = useState(1);

  // Load categories
  useEffect(() => {
    apiFetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch((error: Error) => setRequestError(error.message));
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    setSelectedCategory(searchParams.get("category") || "");
    setSelectedDistrict(searchParams.get("district") || "");
    setSelectedClassification(searchParams.get("classification") || "");
    setPage(1);
  }, [searchParams]);

  // Fetch businesses when filters change
  useEffect(() => {
    const controller = new AbortController();
    async function fetchBusinesses() {
      setLoading(true);
      setRequestError("");
      try {
        const params = new URLSearchParams();
        if (search) params.set("q", search);
        if (selectedCategory) params.set("category", selectedCategory);
        if (selectedDistrict) params.set("district", selectedDistrict);
        if (selectedClassification)
          params.set("classification", selectedClassification);
        params.set("page", page.toString());
        params.set("limit", "12");

        const res = await apiFetch(`/api/businesses?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.businesses) {
          setBusinesses(data.businesses);
          setPagination(data.pagination);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setBusinesses([]);
        setRequestError(
          err instanceof Error
            ? err.message
            : "Unable to complete the request.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    const timer = setTimeout(fetchBusinesses, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    search,
    selectedCategory,
    selectedDistrict,
    selectedClassification,
    page,
  ]);

  const handleReset = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedDistrict("");
    setSelectedClassification("");
    setPage(1);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <Feedback message={requestError} />
      {/* Page Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
          {t.directoryTitle}
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-3xl">
          {t.directorySubtitle} -{" "}
          {language === "mr"
            ? "उत्पादक, व्यापारी, कंत्राटदार आणि व्यावसायिक सेवांची पडताळणी केलेली यादी."
            : "Official directory of verified manufacturers, traders, contractors, and professionals."}
        </p>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              aria-label={t.searchPlaceholder}
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              aria-label="Category"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-navy-950"
            >
              <option value="">{t.allCategories}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {language === "mr" ? c.nameMr : c.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <select
              aria-label="District"
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-navy-950"
            >
              <option value="">{t.allDistricts}</option>
              <option value="रायगड">
                {language === "mr" ? "रायगड" : "Raigad"}
              </option>
              <option value="ठाणे">
                {language === "mr" ? "ठाणे" : "Thane"}
              </option>
              <option value="मुंबई">
                {language === "mr" ? "मुंबई" : "Mumbai"}
              </option>
              <option value="पालघर">
                {language === "mr" ? "पालघर" : "Palghar"}
              </option>
            </select>
          </div>

          {/* Classification Filter */}
          <div>
            <select
              aria-label="Classification"
              value={selectedClassification}
              onChange={(e) => {
                setSelectedClassification(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-navy-950"
            >
              <option value="">
                {language === "mr"
                  ? "सर्व व्यवसाय प्रकार"
                  : "All Business Types"}
              </option>
              <option value="MANUFACTURER">
                {t.classificationManufacturer}
              </option>
              <option value="TRADER">{t.classificationTrader}</option>
              <option value="CONTRACTOR">{t.classificationContractor}</option>
              <option value="PROFESSIONAL">
                {t.classificationProfessional}
              </option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(search ||
          selectedCategory ||
          selectedDistrict ||
          selectedClassification) && (
          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span>
              {pagination.total}{" "}
              {language === "mr" ? "उद्योजक आढळले" : "businesses found"}
            </span>
            <button
              onClick={handleReset}
              className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 font-medium"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t.ctaClear}</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-12 text-center space-y-2">
          <div className="inline-block w-7 h-7 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-600">
            {language === "mr"
              ? "माहिती लोड होत आहे..."
              : "Loading directory listings..."}
          </p>
        </div>
      ) : businesses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 border rounded-md text-xs font-semibold bg-white disabled:opacity-50"
              >
                {t.ctaPrevious}
              </button>
              <span className="text-xs text-slate-600">
                {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 border rounded-md text-xs font-semibold bg-white disabled:opacity-50"
              >
                {t.ctaNext}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-navy-950">
            {t.noResultsFound}
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {language === "mr"
              ? "आपण निवडलेल्या निकषांशी जुळणारे व्यवसाय आढळले नाहीत. कृपया फिल्टर बदला किंवा शोध शब्द तपासा."
              : "No businesses matched your filter parameters. Try clearing some filters or searching with different keywords."}
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            {t.ctaClear}
          </button>
        </div>
      )}
    </div>
  );
}

export default function DirectoryPage() {
  return (
    <Suspense
      fallback={<div className="p-12 text-center">Loading directory...</div>}
    >
      <DirectoryContent />
    </Suspense>
  );
}
