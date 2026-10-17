"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Save, Upload, ArrowUpRight } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { uploadFile } from "@/lib/upload-client";
import { contentKinds, defaultSettings, kindLabels } from "@/lib/community";
import { useLanguage } from "@/components/LanguageContext";
const blank = {
  id: "",
  revision: 1,
  slug: "",
  kind: "RESOURCE",
  titleMr: "",
  titleEn: "",
  summaryMr: "",
  summaryEn: "",
  bodyMr: "",
  bodyEn: "",
  sourceLines: "",
  sourceNoteMr: "",
  sourceNoteEn: "",
  period: "EVERGREEN",
  status: "DRAFT",
  sourceVerified: false,
  featured: false,
  coverImageUrl: "",
  coverCredit: "",
  actionUrl: "",
  eventAt: "",
  location: "",
  editorNotes: "",
};
export default function ContentStudio() {
  const { language } = useLanguage();
  const mr = language === "mr";
  const [tab, setTab] = useState("content");
  const [entries, setEntries] = useState<any[]>([]);
  const [editor, setEditor] = useState(blank);
  const [settings, setSettings] = useState(defaultSettings);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const load = async () => {
    setError("");
    try {
      const [a, b] = await Promise.all([
        apiFetch("/api/admin/community").then((r) => r.json()),
        apiFetch("/api/admin/settings").then((r) => r.json()),
      ]);
      setEntries(a.entries);
      setSettings(b.settings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load content.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const edit = (entry: any) => {
    setEditor({
      ...blank,
      ...entry,
      coverImageUrl: entry.coverImageUrl || "",
      coverCredit: entry.coverCredit || "",
      actionUrl: entry.actionUrl || "",
      location: entry.location || "",
      editorNotes: entry.editorNotes || "",
      sourceLines: entry.sources
        .map(
          (source: { label: string; url: string }) =>
            source.label + " | " + source.url,
        )
        .join("\n"),
      eventAt: entry.eventAt
        ? new Date(new Date(entry.eventAt).getTime() + 330 * 60000)
            .toISOString()
            .slice(0, 16)
        : "",
    });
    setError("");
    setMessage("");
  };
  const update = (key: string, value: string | boolean) =>
    setEditor((previous) => ({
      ...previous,
      [key]: value,
      ...([
        "titleMr",
        "titleEn",
        "summaryMr",
        "summaryEn",
        "bodyMr",
        "bodyEn",
        "sourceLines",
        "sourceNoteMr",
        "sourceNoteEn",
      ].includes(key)
        ? { sourceVerified: false }
        : {}),
    }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || uploading) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const { sourceLines, ...values } = editor;
      const sources = sourceLines
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const separator = line.indexOf("|");
          return {
            label: line.slice(0, separator).trim(),
            url: separator === -1 ? "" : line.slice(separator + 1).trim(),
          };
        });
      const response = await (
        await apiFetch("/api/admin/community", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            id: values.id || undefined,
            sources,
            eventAt: values.eventAt
              ? new Date(values.eventAt + "+05:30").toISOString()
              : "",
          }),
        })
      ).json();
      await load();
      edit(response.entry);
      setMessage(
        mr
          ? "नोंद जतन झाली. प्रकाशित स्थितीतील पडताळलेली माहितीच सार्वजनिक दिसते."
          : "Entry saved. Only verified entries with Published status appear publicly.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save entry.");
    } finally {
      setSaving(false);
    }
  };
  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await (
        await apiFetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        })
      ).json();
      setSettings(response.settings);
      setMessage(
        mr ? "संकेतस्थळ सेटिंग्ज जतन झाल्या." : "Website settings saved.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };
  const image = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw new Error(
          mr
            ? "JPEG, PNG किंवा WebP प्रतिमा निवडा."
            : "Choose a JPEG, PNG or WebP image.",
        );
      update("coverImageUrl", await uploadFile(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };
  const field = (key: string, a: string, b: string, area = false) => (
    <label key={key}>
      {mr ? a : b}
      {area ? (
        <textarea
          className={key.startsWith("body") ? "body-field" : ""}
          value={String(editor[key as keyof typeof editor])}
          maxLength={key.startsWith("body") ? 20000 : 600}
          onChange={(e) => update(key, e.target.value)}
        />
      ) : (
        <input
          required={["slug", "titleMr"].includes(key)}
          value={String(editor[key as keyof typeof editor])}
          maxLength={["titleMr", "titleEn"].includes(key) ? 180 : 1500}
          onChange={(e) => update(key, e.target.value)}
        />
      )}
    </label>
  );
  const statusLabel: Record<string, string> = mr
    ? {
        DRAFT: "मसुदा",
        REVIEW: "तपासणीसाठी",
        PUBLISHED: "प्रकाशित",
        ARCHIVED: "संग्रहित",
      }
    : {
        DRAFT: "Draft",
        REVIEW: "For review",
        PUBLISHED: "Published",
        ARCHIVED: "Archived",
      };
  return (
    <div className="page-shell">
      <header className="page-intro">
        <span className="eyebrow">
          {mr ? "प्रशासक · प्रकाशन नियंत्रण" : "ADMINISTRATION · PUBLISHING"}
        </span>
        <h1>{mr ? "मजकूर आणि संकेतस्थळ." : "Content & website studio."}</h1>
        <p>
          {mr
            ? "समुदायाची माहिती, अधिकृत साधने, मुखपृष्ठ आणि प्रकाशन एका ठिकाणी व्यवस्थापित करा."
            : "Manage community information, official resources, the homepage and publishing in one workspace."}
        </p>
      </header>
      <div
        className="filter-pills"
        role="group"
        aria-label={mr ? "स्टुडिओ विभाग" : "Studio section"}
      >
        <button
          aria-pressed={tab === "content"}
          onClick={() => setTab("content")}
        >
          {mr ? "मजकूर व माध्यमे" : "Content & media"}
        </button>
        <button
          aria-pressed={tab === "settings"}
          onClick={() => setTab("settings")}
        >
          {mr ? "मुखपृष्ठ व सेटिंग्ज" : "Homepage & settings"}
        </button>
      </div>
      {error && (
        <div className="request-notice mb-5" role="alert">
          {error}
        </div>
      )}
      {message && (
        <p className="success-notice mb-5" role="status">
          {message}
        </p>
      )}
      {loading ? (
        <div className="loading-card" role="status">
          {mr ? "माहिती मिळवत आहोत…" : "Loading content…"}
        </div>
      ) : tab === "content" ? (
        <>
          <div className="studio-actions mb-6">
            <button
              className="button button-dark"
              onClick={() => {
                setEditor(blank);
                setError("");
                setMessage("");
              }}
            >
              <Plus size={17} />
              {mr ? "नवी नोंद" : "New entry"}
            </button>
            <button className="button button-light" onClick={load}>
              {mr ? "यादी पुन्हा मिळवा" : "Reload list"}
            </button>
            <p className="studio-hint">
              {mr
                ? "प्रकाशनासाठी दोन्ही भाषांतील माहिती, विश्वसनीय स्रोत आणि स्पष्ट पडताळणी आवश्यक आहे."
                : "Publishing requires both languages, supporting sources and an explicit source verification."}
            </p>
          </div>
          <div className="studio-layout">
            <aside>
              <label className="search-field">
                <span className="sr-only">
                  {mr ? "नोंदी शोधा" : "Find entries"}
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                  placeholder={mr ? "नोंदी शोधा…" : "Find entries…"}
                />
              </label>
              <div className="studio-list mt-4">
                {entries
                  .filter((entry) =>
                    (entry.titleMr + " " + entry.titleEn + " " + entry.status)
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )
                  .map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => edit(entry)}
                      aria-pressed={editor.id === entry.id}
                    >
                      {mr ? entry.titleMr : entry.titleEn || entry.titleMr}
                      <small>
                        {
                          kindLabels[entry.kind as keyof typeof kindLabels]?.[
                            language
                          ]
                        }{" "}
                        · {statusLabel[entry.status]} ·{" "}
                        {mr ? "आवृत्ती " : "Revision "}
                        {entry.revision}
                      </small>
                    </button>
                  ))}
              </div>
            </aside>
            <form className="studio-form" onSubmit={save}>
              <h2>
                {editor.id
                  ? mr
                    ? "नोंद संपादित करा"
                    : "Edit entry"
                  : mr
                    ? "नवी समुदाय नोंद"
                    : "New community entry"}
              </h2>
              <div className="field-grid">
                {field("slug", "दुव्यातील नाव", "URL slug")}
                <label>
                  {mr ? "विषय" : "Content type"}
                  <select
                    value={editor.kind}
                    onChange={(e) => update("kind", e.target.value)}
                  >
                    {contentKinds.map((kind) => (
                      <option key={kind} value={kind}>
                        {kindLabels[kind][language]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="field-grid">
                {field("titleMr", "शीर्षक (मराठी)", "Title (Marathi)")}
                {field("titleEn", "शीर्षक (इंग्रजी)", "Title (English)")}
              </div>
              <div className="field-grid">
                {field(
                  "summaryMr",
                  "सारांश (मराठी)",
                  "Summary (Marathi)",
                  true,
                )}
                {field(
                  "summaryEn",
                  "सारांश (इंग्रजी)",
                  "Summary (English)",
                  true,
                )}
              </div>
              {field(
                "bodyMr",
                "संपूर्ण माहिती (मराठी)",
                "Body (Marathi)",
                true,
              )}
              {field(
                "bodyEn",
                "संपूर्ण माहिती (इंग्रजी)",
                "Body (English)",
                true,
              )}
              <label>
                {mr
                  ? "स्रोत: प्रत्येक ओळीत नाव | HTTPS दुवा"
                  : "Sources: one title | HTTPS URL per line"}
                <textarea
                  value={editor.sourceLines}
                  maxLength={14000}
                  onChange={(e) => update("sourceLines", e.target.value)}
                />
              </label>
              <div className="field-grid">
                {field(
                  "sourceNoteMr",
                  "स्रोत तपासणीची सार्वजनिक नोंद (मराठी)",
                  "Public source review note (Marathi)",
                  true,
                )}
                {field(
                  "sourceNoteEn",
                  "स्रोत तपासणीची सार्वजनिक नोंद (इंग्रजी)",
                  "Public source review note (English)",
                  true,
                )}
              </div>
              <div className="field-grid">
                <label>
                  {mr ? "माहितीचा काळ" : "Information period"}
                  <select
                    value={editor.period}
                    onChange={(e) => update("period", e.target.value)}
                  >
                    <option value="EVERGREEN">
                      {mr ? "सामान्य संदर्भ" : "Evergreen reference"}
                    </option>
                    <option value="CURRENT">
                      {mr ? "चालू माहिती" : "Current information"}
                    </option>
                    <option value="HISTORICAL">
                      {mr ? "ऐतिहासिक" : "Historical"}
                    </option>
                  </select>
                </label>
                <label>
                  {mr ? "प्रकाशन स्थिती" : "Publication status"}
                  <select
                    value={editor.status}
                    onChange={(e) => update("status", e.target.value)}
                  >
                    {Object.entries(statusLabel).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {field(
                "actionUrl",
                "अधिकृत बाह्य दुवा (ऐच्छिक)",
                "Official external link (optional)",
              )}
              {editor.kind === "EVENT" && (
                <div className="field-grid">
                  <label>
                    {mr
                      ? "कार्यक्रमाची वेळ (भारतीय प्रमाणवेळ)"
                      : "Event time (India Standard Time)"}
                    <input
                      type="datetime-local"
                      value={editor.eventAt}
                      onChange={(e) => update("eventAt", e.target.value)}
                    />
                  </label>
                  {field("location", "कार्यक्रमाचे ठिकाण", "Event location")}
                </div>
              )}
              <div className="source-panel">
                <h3>{mr ? "परवानगीसह प्रतिमा" : "Images with permission"}</h3>
                <p>
                  {mr
                    ? "केवळ स्वतःच्या किंवा प्रकाशनाची परवानगी असलेल्या JPEG, PNG किंवा WebP प्रतिमा अपलोड करा (कमाल ५ MB). स्रोत व परवानगीची नोंद द्या. अप्रकाशित प्रतिमा खासगी राहतात."
                    : "Upload only owned or approved JPEG, PNG or WebP images (up to 5 MB). Include the credit and permission record. Unpublished images stay private."}
                </p>
                <label>
                  <Upload size={17} className="inline mr-2" />
                  {mr ? "मुखपृष्ठ प्रतिमा" : "Cover image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    onChange={(e) => image(e.target.files?.[0])}
                  />
                </label>
                {uploading && (
                  <p role="status">{mr ? "अपलोड सुरू आहे…" : "Uploading…"}</p>
                )}
                {editor.coverImageUrl && (
                  <div>
                    <p className="break-all">{editor.coverImageUrl}</p>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => update("coverImageUrl", "")}
                    >
                      {mr ? "प्रतिमा वेगळी करा" : "Detach image"}
                    </button>
                  </div>
                )}
                {field(
                  "coverCredit",
                  "प्रतिमेचे श्रेय व प्रकाशन परवानगी",
                  "Image credit & publication permission",
                )}
              </div>
              {field(
                "editorNotes",
                "अंतर्गत संपादकीय नोंदी (खासगी)",
                "Internal editorial notes (private)",
                true,
              )}
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editor.sourceVerified}
                  onChange={(e) => update("sourceVerified", e.target.checked)}
                />
                {mr
                  ? "मी स्रोत तपासले आहेत; माहितीचा काळ आणि प्रकाशनाच्या परवानग्या योग्य आहेत."
                  : "I checked the sources, the period of the information and the required publication permissions."}
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editor.featured}
                  onChange={(e) => update("featured", e.target.checked)}
                />
                {mr
                  ? "संबंधित मुखपृष्ठ विभागात प्राधान्य द्या"
                  : "Prioritize in the relevant homepage section"}
              </label>
              <div className="studio-actions">
                <button
                  className="button button-dark"
                  disabled={saving || uploading}
                  type="submit"
                >
                  <Save size={17} />
                  {saving
                    ? mr
                      ? "जतन होत आहे…"
                      : "Saving…"
                    : mr
                      ? "नोंद जतन करा"
                      : "Save entry"}
                </button>
                {editor.id && editor.status === "PUBLISHED" && (
                  <Link
                    href={"/community/" + editor.slug}
                    target="_blank"
                    className="text-link"
                  >
                    {mr ? "प्रकाशित पान पाहा" : "View published page"}
                    <ArrowUpRight size={16} />
                  </Link>
                )}
              </div>
            </form>
          </div>
        </>
      ) : (
        <form className="studio-form max-w-4xl" onSubmit={saveSettings}>
          <h2>
            {mr ? "मुखपृष्ठ आणि सार्वजनिक संपर्क" : "Homepage & public contact"}
          </h2>
          {[
            [
              "heroTitleMr",
              "मुखपृष्ठ शीर्षक (मराठी)",
              "Homepage title (Marathi)",
            ],
            [
              "heroTitleEn",
              "मुखपृष्ठ शीर्षक (इंग्रजी)",
              "Homepage title (English)",
            ],
            [
              "heroDescriptionMr",
              "मुखपृष्ठ परिचय (मराठी)",
              "Homepage description (Marathi)",
            ],
            [
              "heroDescriptionEn",
              "मुखपृष्ठ परिचय (इंग्रजी)",
              "Homepage description (English)",
            ],
            ["noticeMr", "सूचना (मराठी, ऐच्छिक)", "Notice (Marathi, optional)"],
            [
              "noticeEn",
              "सूचना (इंग्रजी, ऐच्छिक)",
              "Notice (English, optional)",
            ],
          ].map(([key, a, b]) => (
            <label key={key}>
              {mr ? a : b}
              <textarea
                value={String(settings[key as keyof typeof settings])}
                maxLength={key.startsWith("heroTitle") ? 180 : 700}
                onChange={(e) =>
                  setSettings({ ...settings, [key]: e.target.value })
                }
              />
            </label>
          ))}
          <label>
            {mr
              ? "सार्वजनिक ईमेल (अधिकृतरीत्या उपलब्ध असल्यास)"
              : "Public email (only if authorized and available)"}
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) =>
                setSettings({ ...settings, contactEmail: e.target.value })
              }
            />
          </label>
          <p className="studio-hint">
            {mr
              ? "प्रकाशित मजकूर संपादित करण्यासाठी संबंधित नोंद निवडा. बदल जतन केल्यानंतर नवीन पृष्ठ उघडल्यावर दिसतात."
              : "To edit published community content, select its entry. Saved settings appear when visitors open a new page."}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="button button-dark"
          >
            <Save size={17} />
            {saving
              ? mr
                ? "जतन होत आहे…"
                : "Saving…"
              : mr
                ? "सेटिंग्ज जतन करा"
                : "Save settings"}
          </button>
        </form>
      )}
    </div>
  );
}
