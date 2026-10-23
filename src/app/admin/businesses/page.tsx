"use client";
import Modal from "@/components/Modal";
import Feedback from "@/components/Feedback";
import AdminPagination from "@/components/AdminPagination";
import type { Pagination } from "@/lib/pagination";
import { apiFetch } from "@/lib/client-api";

import { useLanguage } from "@/components/LanguageContext";
import { getLocalizedBusiness } from "@/lib/localize";
import { ArrowLeft, Check, Filter, Search, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function AdminBusinessesContent() {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [requestError, setRequestError] = useState("");

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState(
    searchParams.get("status") || "ALL",
  );
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBusinesses = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setRequestError("");
      try {
        const params = new URLSearchParams({
          status: filterStatus,
          q: query,
          page: String(page),
          limit: "25",
        });
        const res = await apiFetch(`/api/admin/businesses?${params}`, {
          signal,
        });
        const data = await res.json();
        if (signal?.aborted) return;
        if (data.businesses) setBusinesses(data.businesses);
        if (data.pagination) {
          setPagination(data.pagination);
          if (page > Math.max(1, data.pagination.totalPages))
            setPage(Math.max(1, data.pagination.totalPages));
        }
      } catch (e) {
        if (signal?.aborted) return;
        setRequestError(
          e instanceof Error ? e.message : "Unable to complete the request.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [filterStatus, query, page],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchBusinesses(controller.signal);
    return () => controller.abort();
  }, [fetchBusinesses]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (saving) return;
    setSaving(true);
    setRequestError("");
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/admin/businesses/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: remarks,
          rejectionReason:
            newStatus === "REJECTED" || newStatus === "REVISION_REQUIRED"
              ? remarks
              : null,
        }),
      });

      if (res.ok) {
        setSelectedBusiness(null);
        setRemarks("");
        await fetchBusinesses();
      }
    } catch (e) {
      setRequestError(
        e instanceof Error ? e.message : "Unable to complete the request.",
      );
    } finally {
      setSaving(false);
      setActionLoading(false);
    }
  };

  const filtered = businesses;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <Feedback message={requestError} />
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-navy-950"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {language === "mr"
              ? "प्रशासक नियंत्रण कक्षाकडे परत जा (Admin Dashboard)"
              : "Back to Admin Dashboard"}
          </span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
          {language === "mr"
            ? "व्यवसाय नोंदणी अर्ज पडताळणी कक्ष"
            : "Business Registration Verification Portal"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {language === "mr"
            ? "आगरी उद्योजक डिरेक्टरीमध्ये प्रसिद्धीसाठी सादर केलेल्या सर्व अर्जांची छाननी, मंजुरी किंवा दुरुस्ती निर्देश."
            : "Scrutinize, approve, or request revisions for all enterprise applications submitted for the Agri Directory."}
        </p>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          {["ALL", "PENDING", "APPROVED", "REVISION_REQUIRED", "REJECTED"].map(
            (st) => (
              <button
                disabled={saving}
                key={st}
                onClick={() => {
                  setFilterStatus(st);
                  setPage(1);
                }}
                aria-pressed={filterStatus === st}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterStatus === st
                    ? "bg-navy-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {st === "ALL"
                  ? language === "mr"
                    ? "सर्व"
                    : "All"
                  : st === "PENDING"
                    ? language === "mr"
                      ? "प्रलंबित (Pending)"
                      : "Pending"
                    : st === "APPROVED"
                      ? language === "mr"
                        ? "मंजूर (Approved)"
                        : "Approved"
                      : st === "REVISION_REQUIRED"
                        ? language === "mr"
                          ? "सुधारणा (Revision)"
                          : "Revision"
                        : language === "mr"
                          ? "नामंजूर (Rejected)"
                          : "Rejected"}
              </button>
            ),
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            aria-label={language === "mr" ? "अर्ज शोधा" : "Search applications"}
            maxLength={200}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === "mr"
                ? "उद्योगाचे नाव किंवा संदर्भ क्र. शोधा..."
                : "Search business name or ref number..."
            }
            className="w-full pl-9 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Business List Table */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">
                    {language === "mr" ? "संदर्भ क्र." : "Ref No."}
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    {language === "mr" ? "उद्योगाचे नाव" : "Enterprise Name"}
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    {language === "mr"
                      ? "उद्योजक व फोन"
                      : "Entrepreneur & Phone"}
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    {language === "mr" ? "शाखा / वर्गवारी" : "Category"}
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    {language === "mr" ? "पत्ता / ठिकाण" : "Location"}
                  </th>
                  <th className="px-4 py-3 text-left font-bold">
                    {language === "mr" ? "स्थिती" : "Status"}
                  </th>
                  <th className="px-4 py-3 text-right font-bold">
                    {language === "mr" ? "कृती" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => {
                  const loc = getLocalizedBusiness(b, language);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-bold text-navy-950">
                        {b.refNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-navy-950">
                        <div>{loc.businessName}</div>
                        {b.brandName && (
                          <div className="text-[10px] text-amber-700">
                            {b.brandName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>{loc.ownerName}</div>
                        <div className="text-slate-400 font-mono">
                          {b.ownerPhone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {loc.categoryName}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {loc.officeCity}, {loc.officeDistrict}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            b.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : b.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : b.status === "REVISION_REQUIRED"
                                  ? "bg-orange-50 text-orange-700"
                                  : "bg-red-50 text-red-700"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          disabled={saving}
                          onClick={() => setSelectedBusiness(b)}
                          className="px-3 py-1 bg-navy-900 hover:bg-amber-600 text-white rounded text-[11px] font-bold transition"
                        >
                          {language === "mr"
                            ? "तपासा / निर्णय"
                            : "Review / Action"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
          {language === "mr"
            ? "या निकषांशी जुळणारा अर्ज सापडला नाही."
            : "No applications match these filters."}
        </p>
      )}
      <AdminPagination
        pagination={pagination}
        loading={loading || saving}
        onPageChange={setPage}
      />

      {/* Review Modal */}
      {selectedBusiness &&
        (() => {
          const selLoc = getLocalizedBusiness(selectedBusiness, language);
          return (
            <Modal
              title="Business review"
              error={requestError}
              onClose={() => setSelectedBusiness(null)}
            >
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-700">
                      {selectedBusiness.refNumber}
                    </span>
                    <h2 className="text-xl font-bold text-navy-950">
                      {selLoc.businessName}
                    </h2>
                  </div>
                  <button
                    disabled={saving}
                    aria-label={
                      language === "mr"
                        ? "अर्ज तपासणी बंद करा"
                        : "Close business review"
                    }
                    onClick={() => setSelectedBusiness(null)}
                    className="p-1 rounded text-slate-400 hover:text-navy-950"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Application Data Details (PDF Page 4 data) */}
                <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <strong>
                        {language === "mr" ? "उद्योजक:" : "Entrepreneur:"}
                      </strong>{" "}
                      {selLoc.ownerName}
                    </div>
                    <div>
                      <strong>
                        {language === "mr" ? "मोबाईल:" : "Mobile:"}
                      </strong>{" "}
                      {selectedBusiness.ownerPhone}
                    </div>
                    <div>
                      <strong>{language === "mr" ? "ईमेल:" : "Email:"}</strong>{" "}
                      {selectedBusiness.ownerEmail || "-"}
                    </div>
                    <div>
                      <strong>
                        {language === "mr" ? "शिक्षण:" : "Education:"}
                      </strong>{" "}
                      {selectedBusiness.ownerEducationSchool || "-"} /{" "}
                      {selectedBusiness.ownerEducationVocational || "-"}
                    </div>
                    <div>
                      <strong>
                        {language === "mr"
                          ? "उद्योग प्रकार:"
                          : "Classification:"}
                      </strong>{" "}
                      {selLoc.classification}
                    </div>
                    <div>
                      <strong>
                        {language === "mr" ? "मालकी:" : "Ownership:"}
                      </strong>{" "}
                      {selLoc.ownership}
                    </div>
                    <div>
                      <strong>
                        {language === "mr" ? "स्थापना वर्ष:" : "Est. Year:"}
                      </strong>{" "}
                      {selectedBusiness.establishedYear || "-"}
                    </div>
                    <div>
                      <strong>
                        {language === "mr" ? "कर्मचारी:" : "Employees:"}
                      </strong>{" "}
                      {selectedBusiness.employeeCountTotal || "-"}
                    </div>
                    <div className="col-span-2">
                      <strong>
                        {language === "mr"
                          ? "कार्यालय पत्ता:"
                          : "Office Address:"}
                      </strong>{" "}
                      {selLoc.officeAddress}, {selLoc.officeCity},{" "}
                      {selLoc.officeTaluka}, {selLoc.officeDistrict} -{" "}
                      {selectedBusiness.officePincode}
                    </div>
                    {selectedBusiness.factoryAddress && (
                      <div className="col-span-2">
                        <strong>
                          {language === "mr"
                            ? "कारखाना पत्ता:"
                            : "Factory Address:"}
                        </strong>{" "}
                        {selLoc.factoryAddress ||
                          selectedBusiness.factoryAddress}
                      </div>
                    )}
                    <div className="col-span-2">
                      <strong>
                        {language === "mr"
                          ? "उत्पादने / सेवा:"
                          : "Products / Services:"}
                      </strong>{" "}
                      {selLoc.productsServices}
                    </div>
                    {selectedBusiness.documentUrl && (
                      <div className="col-span-2 pt-1">
                        <strong>
                          {language === "mr"
                            ? "पडताळणी कागदपत्र:"
                            : "Verification Document:"}
                        </strong>{" "}
                        <a
                          href={selectedBusiness.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-800 underline font-semibold ml-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                        >
                          {language === "mr"
                            ? "अपलोड केलेले कागदपत्र उघडा"
                            : "Open Uploaded Document"}
                        </a>
                      </div>
                    )}
                    {selectedBusiness.logoUrl && (
                      <div className="col-span-2 pt-1">
                        <strong>
                          {language === "mr"
                            ? "व्यवसाय लोगो:"
                            : "Business Logo:"}
                        </strong>{" "}
                        <a
                          href={selectedBusiness.logoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-800 underline font-semibold ml-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                        >
                          {language === "mr"
                            ? "अपलोड केलेला लोगो पहा"
                            : "Open Logo"}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Remarks Input */}
                <div className="space-y-1">
                  <label
                    className="text-xs font-bold text-slate-700"
                    htmlFor="field-1"
                  >
                    {language === "mr"
                      ? "प्रशासकीय शेरा किंवा दुरुस्ती सूचना (Admin Remarks / Notes):"
                      : "Administrative Remarks / Notes:"}
                  </label>
                  <textarea
                    id="field-1"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={
                      language === "mr"
                        ? "उदा. कागदपत्रे वैध आहेत, डिरेक्टरीमध्ये मंजूर / पत्ता अपूर्ण आहे..."
                        : "e.g. Documents verified, approved for directory / address incomplete..."
                    }
                    rows={3}
                    className="w-full p-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        handleStatusChange(selectedBusiness.id, "REJECTED")
                      }
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      {language === "mr" ? "नामंजूर (Reject)" : "Reject"}
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        handleStatusChange(
                          selectedBusiness.id,
                          "REVISION_REQUIRED",
                        )
                      }
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      {language === "mr"
                        ? "सुधारणा सांगा (Request Revision)"
                        : "Request Revision"}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      handleStatusChange(selectedBusiness.id, "APPROVED")
                    }
                    className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow disabled:opacity-50 flex items-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {language === "mr"
                        ? "डिरेक्टरीसाठी मंजूर करा (Approve)"
                        : "Approve for Directory"}
                    </span>
                  </button>
                </div>
              </div>
            </Modal>
          );
        })()}
    </div>
  );
}

export default function AdminBusinessesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
      <AdminBusinessesContent />
    </Suspense>
  );
}
