"use client";
import { useLanguage } from "./LanguageContext";
import type { Pagination } from "@/lib/pagination";

export default function AdminPagination({
  pagination,
  loading,
  onPageChange,
}: {
  pagination: Pagination;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const { language } = useLanguage();
  const mr = language === "mr";
  const { page, limit, total, totalPages } = pagination;
  const first = total ? (page - 1) * limit + 1 : 0;
  const last = Math.min(page * limit, total);
  return (
    <nav
      aria-label={mr ? "निकालांची पाने" : "Results pagination"}
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm"
    >
      <p role="status" aria-live="polite" className="text-slate-600">
        {mr
          ? `${total} पैकी ${first}–${last} निकाल`
          : `${first}–${last} of ${total} results`}
        {totalPages > 0 && (
          <span className="ml-2">
            {mr
              ? `पान ${page} / ${totalPages}`
              : `Page ${page} of ${totalPages}`}
          </span>
        )}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mr ? "मागील" : "Previous"}
        </button>
        <button
          type="button"
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mr ? "पुढील" : "Next"}
        </button>
      </div>
    </nav>
  );
}
