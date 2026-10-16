"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "./LanguageContext";
import { apiFetch } from "@/lib/client-api";
import Feedback from "./Feedback";
type Field = {
  key: string;
  mr: string;
  en: string;
  type?: string;
  options?: string[];
};
export default function RecordManager({
  endpoint,
  title,
  fields,
  defaults,
}: {
  endpoint: string;
  title: string;
  fields: Field[];
  defaults: Record<string, string | boolean | number>;
}) {
  const { language } = useLanguage();
  const [records, setRecords] = useState<Record<string, any>[]>([]);
  const [form, setForm] = useState(defaults);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => {
    const response = await apiFetch(endpoint);
    setRecords((await response.json()).records);
  };
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [endpoint]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await load();
      setEditing(false);
      setForm(defaults);
      setMessage(language === "mr" ? "नोंद जतन झाली." : "Record saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="bg-white p-5 sm:p-7 border rounded-2xl space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <button
          className="bg-navy-950 text-white px-4 py-2 rounded-lg"
          onClick={() => {
            setForm(defaults);
            setEditing(true);
            setError("");
          }}
        >
          {language === "mr" ? "नवीन नोंद" : "Add record"}
        </button>
      </div>
      <Feedback message={error} />
      {message && (
        <p role="status" className="text-emerald-800">
          {message}
        </p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {records.map((record) => (
          <article key={record.id} className="border rounded-xl p-4 space-y-3">
            <h3 className="font-bold">
              {language === "mr"
                ? record.nameMr || record.titleMr
                : record.nameEn || record.titleEn}
            </h3>
            <p className="text-sm text-slate-600">
              {record.price != null
                ? new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(record.price)
                : record.editionYear}
            </p>
            <p className="text-sm">
              {record.isActive === false || record.isPublic === false
                ? language === "mr"
                  ? "अप्रकाशित"
                  : "Unpublished"
                : language === "mr"
                  ? "प्रकाशित"
                  : "Published"}
            </p>
            <button
              className="text-amber-800 underline"
              onClick={() => {
                setForm(
                  Object.fromEntries(
                    Object.keys(defaults).map((key) => [
                      key,
                      record[key] ?? defaults[key],
                    ]),
                  ),
                );
                setEditing(true);
              }}
            >
              {language === "mr" ? "संपादन" : "Edit"}
            </button>
          </article>
        ))}
      </div>
      {!records.length && (
        <p className="text-sm text-slate-600">
          {language === "mr" ? "अद्याप नोंदी नाहीत." : "No records yet."}
        </p>
      )}
      {editing && (
        <form
          onSubmit={save}
          className="border-t pt-5 grid sm:grid-cols-2 gap-4"
        >
          {fields.map((field) => (
            <div key={field.key} className="space-y-1">
              <label
                htmlFor={`record-${field.key}`}
                className="block text-sm font-semibold"
              >
                {language === "mr" ? field.mr : field.en}
              </label>
              {field.options ? (
                <select
                  id={`record-${field.key}`}
                  className="w-full p-2 border rounded-lg"
                  value={String(form[field.key])}
                  onChange={(e) =>
                    setForm({ ...form, [field.key]: e.target.value })
                  }
                >
                  {field.options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <input
                  id={`record-${field.key}`}
                  type="checkbox"
                  checked={Boolean(form[field.key])}
                  onChange={(e) =>
                    setForm({ ...form, [field.key]: e.target.checked })
                  }
                />
              ) : (
                <input
                  id={`record-${field.key}`}
                  type={field.type || "text"}
                  step={field.type === "number" ? "0.01" : undefined}
                  className="w-full p-2 border rounded-lg"
                  value={String(form[field.key] ?? "")}
                  onChange={(e) =>
                    setForm({ ...form, [field.key]: e.target.value })
                  }
                />
              )}
            </div>
          ))}
          <div className="sm:col-span-2 flex gap-3">
            <button
              disabled={busy}
              className="bg-navy-950 text-white px-5 py-2 rounded-lg"
              type="submit"
            >
              {busy
                ? language === "mr"
                  ? "जतन होत आहे…"
                  : "Saving…"
                : language === "mr"
                  ? "जतन करा"
                  : "Save"}
            </button>
            <button
              disabled={busy}
              type="button"
              className="border px-5 py-2 rounded-lg"
              onClick={() => setEditing(false)}
            >
              {language === "mr" ? "रद्द करा" : "Cancel"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
