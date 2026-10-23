"use client";

import { useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  LoaderCircle,
  Mic,
  Send,
  Square,
  Volume2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "./LanguageContext";
import type { AssistantReply } from "@/lib/assistant-contract";
import { MAX_RECORDING_SECONDS } from "@/lib/assistant-contract";
import { prepareRecording } from "@/lib/assistant-audio";
import CopyAnswer from "./CopyAnswer";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  language: "mr" | "en";
  reply?: AssistantReply;
};
type Operation =
  "chat" | "permission" | "recording" | "transcribe" | "speech" | null;

async function jsonResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      data.error || "The request could not be completed. Please try again.",
    );
  return data;
}

export default function CommunityAssistant({
  onClose,
}: {
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const mr = language === "mr";
  const text = (en: string, marathi: string) => (mr ? marathi : en);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [operation, setOperation] = useState<Operation>(null);
  const [error, setError] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [needsPlay, setNeedsPlay] = useState(false);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const request = useRef<AbortController | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const discard = useRef(false);
  const mounted = useRef(true);
  const generation = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const audioUrl = useRef<string | null>(null);

  function stopAudio() {
    if (audio.current) {
      audio.current.onerror = null;
      audio.current.onended = null;
      audio.current.pause();
      audio.current.src = "";
      audio.current = null;
    }
    if (audioUrl.current) {
      URL.revokeObjectURL(audioUrl.current);
      audioUrl.current = null;
    }
    setPlaying(null);
    setNeedsPlay(false);
  }
  function releaseMicrophone() {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }
  function cancel() {
    generation.current++;
    request.current?.abort();
    request.current = null;
    discard.current = true;
    if (recorder.current?.state === "recording") recorder.current.stop();
    recorder.current = null;
    releaseMicrophone();
    stopAudio();
    setOperation(null);
  }
  useEffect(() => {
    mounted.current = true;
    const element = dialog.current;
    element?.showModal();
    const controller = new AbortController();
    fetch("/api/assistant", { signal: controller.signal, cache: "no-store" })
      .then(jsonResponse)
      .then((data) => setAvailable(data.available === true))
      .catch(() => {
        if (!controller.signal.aborted) setAvailable(false);
      });
    return () => {
      mounted.current = false;
      generation.current++;
      controller.abort();
      request.current?.abort();
      discard.current = true;
      if (recorder.current?.state === "recording") recorder.current.stop();
      if (timer.current) clearInterval(timer.current);
      stream.current?.getTracks().forEach((track) => track.stop());
      if (audio.current) {
        audio.current.onerror = null;
        audio.current.onended = null;
        audio.current.pause();
      }
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
      element?.close();
    };
  }, []);
  useEffect(() => {
    log.current?.scrollTo({
      top: log.current.scrollHeight,
      behavior: "instant",
    });
  }, [messages, operation, error, notice]);

  async function speak(message: Message) {
    if (!message.reply || operation) return;
    stopAudio();
    setError("");
    setOperation("speech");
    const controller = new AbortController();
    request.current = controller;
    try {
      const response = await fetch("/api/assistant/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message.content,
          language: message.language,
          token: message.reply.speechToken,
        }),
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(55000),
        ]),
      });
      if (!response.ok) await jsonResponse(response);
      const blob = await response.blob();
      if (controller.signal.aborted || !mounted.current) return;
      audioUrl.current = URL.createObjectURL(blob);
      const player = new Audio(audioUrl.current);
      audio.current = player;
      player.onended = () => stopAudio();
      player.onerror = () => {
        stopAudio();
        setError(
          text(
            "Audio playback failed. You can still read the reply.",
            "आवाज ऐकवता आला नाही. उत्तर वाचता येईल.",
          ),
        );
      };
      setPlaying(message.id);
      try {
        await player.play();
      } catch (e) {
        if (e instanceof DOMException && e.name === "NotAllowedError") {
          setNeedsPlay(true);
          setNotice(
            text(
              "Your browser paused the audio. Tap Play audio to listen.",
              "ब्राउझरने आवाज थांबवला आहे. ऐकण्यासाठी ‘आवाज ऐका’ दाबा.",
            ),
          );
        } else throw e;
      }
    } catch (e) {
      if (!controller.signal.aborted && mounted.current) {
        stopAudio();
        setError(e instanceof Error ? e.message : "Voice playback failed.");
      }
    } finally {
      if (request.current === controller && mounted.current) {
        request.current = null;
        setOperation(null);
      }
    }
  }

  async function send(question = draft) {
    const content = question.trim();
    if (!content || content.length > 1200 || operation || available !== true)
      return;
    stopAudio();
    setError("");
    setNotice("");
    setOperation("chat");
    const controller = new AbortController();
    request.current = controller;
    let history = messages
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));
    while (
      history.reduce((sum, message) => sum + message.content.length, 0) > 14000
    )
      history = history.slice(1);
    try {
      const data: AssistantReply = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, language, history }),
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(55000),
        ]),
      }).then(jsonResponse);
      if (controller.signal.aborted || !mounted.current) return;
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        language,
        reply: data,
      };
      setMessages((previous) =>
        [
          ...previous,
          { id: crypto.randomUUID(), role: "user" as const, content, language },
          reply,
        ].slice(-30),
      );
      setDraft("");
      setOperation(null);
      request.current = null;
      if (voiceReplies) void speak(reply);
      else input.current?.focus();
    } catch (e) {
      if (!controller.signal.aborted && mounted.current)
        setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      if (request.current === controller && mounted.current) {
        request.current = null;
        setOperation(null);
      }
    }
  }

  async function record() {
    if (operation === "recording") {
      recorder.current?.stop();
      return;
    }
    if (operation || available !== true) return;
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined" ||
      typeof AudioContext === "undefined"
    ) {
      setError(
        text(
          "Voice recording is unavailable in this browser. You can type your question.",
          "या ब्राउझरमध्ये ध्वनिमुद्रण उपलब्ध नाही. प्रश्न टाइप करा.",
        ),
      );
      return;
    }
    stopAudio();
    setError("");
    setNotice("");
    setOperation("permission");
    const current = ++generation.current;
    try {
      const microphone = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      if (!mounted.current || current !== generation.current) {
        microphone.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = microphone;
      const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(
        (value) => MediaRecorder.isTypeSupported(value),
      );
      const recording = new MediaRecorder(
        microphone,
        type ? { mimeType: type } : undefined,
      );
      recorder.current = recording;
      discard.current = false;
      const chunks: BlobPart[] = [];
      recording.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recording.onerror = () => {
        discard.current = true;
        releaseMicrophone();
        setOperation(null);
        setError(
          text(
            "Recording failed. Please try again or type a question.",
            "ध्वनिमुद्रण अयशस्वी झाले. पुन्हा प्रयत्न करा किंवा प्रश्न टाइप करा.",
          ),
        );
      };
      recording.onstop = async () => {
        releaseMicrophone();
        recorder.current = null;
        if (
          discard.current ||
          !mounted.current ||
          current !== generation.current
        )
          return;
        setOperation("transcribe");
        const controller = new AbortController();
        request.current = controller;
        try {
          const wav = await prepareRecording(
            new Blob(chunks, { type: recording.mimeType }),
          );
          if (controller.signal.aborted) return;
          const data = await fetch(
            `/api/assistant/transcribe?language=${language}`,
            {
              method: "POST",
              headers: { "Content-Type": "audio/wav" },
              body: wav,
              signal: AbortSignal.any([
                controller.signal,
                AbortSignal.timeout(55000),
              ]),
            },
          ).then(jsonResponse);
          if (!controller.signal.aborted && mounted.current) {
            setDraft(data.text);
            setVoiceReplies(true);
            setNotice(
              text(
                "Review the transcript, then send your question.",
                "लिप्यंतर तपासा आणि नंतर प्रश्न पाठवा.",
              ),
            );
            input.current?.focus();
          }
        } catch (e) {
          if (!controller.signal.aborted && mounted.current)
            setError(e instanceof Error ? e.message : "Transcription failed.");
        } finally {
          if (request.current === controller && mounted.current) {
            request.current = null;
            setOperation(null);
          }
        }
      };
      recording.start();
      setSeconds(0);
      setOperation("recording");
      let elapsed = 0;
      timer.current = setInterval(() => {
        elapsed++;
        setSeconds(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS && recording.state === "recording")
          recording.stop();
      }, 1000);
    } catch (e) {
      releaseMicrophone();
      if (mounted.current && current === generation.current) {
        setOperation(null);
        setError(
          e instanceof DOMException && e.name === "NotAllowedError"
            ? text(
                "Microphone access was denied. Allow it in your browser settings or type your question.",
                "मायक्रोफोनची परवानगी मिळाली नाही. ब्राउझरमध्ये परवानगी द्या किंवा प्रश्न टाइप करा.",
              )
            : text(
                "No usable microphone was found. Check your device or type your question.",
                "मायक्रोफोन उपलब्ध नाही. उपकरण तपासा किंवा प्रश्न टाइप करा.",
              ),
        );
      }
    }
  }

  const busy = operation !== null;
  return (
    <dialog
      ref={dialog}
      aria-labelledby="assistant-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-auto h-[min(760px,100dvh-24px)] max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-navy-950 shadow-2xl backdrop:bg-navy-950/50 sm:mr-6 sm:mb-6"
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex items-start justify-between gap-3 bg-navy-950 px-4 py-4 text-white">
          <div>
            <h2 id="assistant-title" className="text-lg font-bold">
              {text("Agri Samaj AI assistant", "आगरी समाज AI सहाय्यक")}
            </h2>
            <p className="mt-1 text-xs text-slate-200">
              {text(
                "Community information · Businesses · Website help",
                "समाज माहिती · व्यवसाय · संकेतस्थळ मदत",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={text("Close assistant", "सहाय्यक बंद करा")}
            className="rounded-lg p-2 hover:bg-white/15 focus-visible:outline-2"
          >
            <X size={20} />
          </button>
        </header>
        <div className="border-b border-slate-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-slate-700">
          {text(
            "AI can make mistakes; check the linked sources. Messages and recordings you send are processed by OpenAI. Avoid private documents or passwords. Replies use an AI-generated voice.",
            "AI कडून चुका होऊ शकतात; दिलेले स्रोत तपासा. पाठवलेले संदेश व ध्वनिमुद्रणे OpenAI कडून प्रक्रिया केली जातात. खासगी कागदपत्रे किंवा पासवर्ड पाठवू नका. उत्तराचा आवाज AI निर्मित आहे.",
          )}{" "}
          <Link
            href="/privacy"
            onClick={onClose}
            className="font-semibold underline"
          >
            {text("Privacy", "गोपनीयता")}
          </Link>
        </div>
        <div
          ref={log}
          role="log"
          aria-label={text("Conversation", "संभाषण")}
          aria-live="polite"
          aria-relevant="additions"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
        >
          {!messages.length && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                {text(
                  "Ask in Marathi or English. I can help you find public information and explain how this website works.",
                  "मराठी किंवा इंग्रजीत प्रश्न विचारा. सार्वजनिक माहिती शोधण्यास व संकेतस्थळ वापरण्यास मी मदत करू शकतो.",
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  text(
                    "How do I register my business?",
                    "व्यवसायाची नोंदणी कशी करू?",
                  ),
                  text(
                    "Where can I find scholarships?",
                    "शिष्यवृत्तीची माहिती कुठे मिळेल?",
                  ),
                  text(
                    "Tell me about Agri culture",
                    "आगरी संस्कृतीबद्दल सांगा",
                  ),
                ].map((question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={busy || available !== true}
                    onClick={() => {
                      setDraft(question);
                      input.current?.focus();
                    }}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-left text-xs hover:border-amber-600 hover:bg-amber-50 disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message) => (
            <article
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-8 rounded-2xl bg-navy-950 p-3 text-white"
                  : "mr-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
              }
            >
              <p className="mb-1 text-xs font-semibold opacity-75">
                {message.role === "user"
                  ? text("You", "तुम्ही")
                  : text("AI assistant", "AI सहाय्यक")}
              </p>
              <p
                lang={message.language}
                className="whitespace-pre-wrap break-words text-sm leading-relaxed"
              >
                {message.content}
              </p>
              {!!message.reply?.sources.length && (
                <ul
                  aria-label={text("Sources", "स्रोत")}
                  className="mt-3 space-y-2"
                >
                  {message.reply.sources
                    .filter(
                      (source) =>
                        source.url.startsWith("/") &&
                        !source.url.startsWith("//"),
                    )
                    .map((source) => (
                      <li key={source.id}>
                        <Link
                          href={source.url}
                          onClick={onClose}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 underline decoration-amber-400 underline-offset-2"
                        >
                          <ExternalLink size={12} aria-hidden="true" />
                          {source.title}
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
              {message.reply && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    playing === message.id
                      ? needsPlay
                        ? void audio.current
                            ?.play()
                            .then(() => {
                              setNeedsPlay(false);
                              setNotice("");
                            })
                            .catch(() =>
                              setError(
                                text(
                                  "Audio playback failed. Please check your browser settings.",
                                  "आवाज ऐकवता आला नाही. ब्राउझर सेटिंग तपासा.",
                                ),
                              ),
                            )
                        : stopAudio()
                      : void speak(message)
                  }
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs hover:bg-amber-50 disabled:opacity-50"
                >
                  {playing === message.id ? (
                    <Square size={14} />
                  ) : (
                    <Volume2 size={14} />
                  )}
                  {playing === message.id
                    ? needsPlay
                      ? text("Play audio", "आवाज ऐका")
                      : text("Stop audio", "आवाज थांबवा")
                    : text("Read aloud", "उत्तर ऐका")}
                </button>
              )}
              {message.reply && (
                <CopyAnswer
                  answer={message.content}
                  sources={message.reply.sources}
                />
              )}
            </article>
          ))}
          {operation && (
            <p
              role="status"
              className="flex items-center gap-2 text-sm text-slate-600"
            >
              <LoaderCircle
                size={16}
                className="motion-safe:animate-spin"
                aria-hidden="true"
              />
              {operation === "chat"
                ? text("Finding an answer…", "उत्तर शोधत आहे…")
                : operation === "recording"
                  ? text(
                      `Recording ${seconds}/30s. Tap stop when done.`,
                      `ध्वनिमुद्रण ${seconds}/३० से. पूर्ण झाल्यावर थांबवा.`,
                    )
                  : operation === "transcribe"
                    ? text(
                        "Transcribing your question…",
                        "प्रश्नाचे लिप्यंतर होत आहे…",
                      )
                    : operation === "permission"
                      ? text(
                          "Waiting for microphone permission…",
                          "मायक्रोफोनच्या परवानगीची प्रतीक्षा…",
                        )
                      : text(
                          "Preparing voice reply…",
                          "उत्तराचा आवाज तयार होत आहे…",
                        )}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"
            >
              {notice}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          {available === false && (
            <p role="status" className="text-sm text-slate-700">
              {text(
                "The assistant is unavailable right now. Please try again later or visit our contact page.",
                "सहाय्यक सध्या उपलब्ध नाही. नंतर पुन्हा प्रयत्न करा किंवा संपर्क पृष्ठाला भेट द्या.",
              )}{" "}
              <Link href="/contact" onClick={onClose} className="underline">
                {text("Contact us", "संपर्क")}
              </Link>
            </p>
          )}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
          className="space-y-2 border-t border-slate-200 bg-white p-3"
        >
          <label htmlFor="assistant-question" className="sr-only">
            {text("Your question", "तुमचा प्रश्न")}
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id="assistant-question"
              ref={input}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={1200}
              rows={2}
              disabled={busy || available !== true}
              placeholder={text("Type a question…", "प्रश्न लिहा…")}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  void send();
                }
              }}
              className="min-w-0 flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-base focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={busy || available !== true || !draft.trim()}
              aria-label={text("Send question", "प्रश्न पाठवा")}
              className="rounded-xl bg-navy-950 p-3 text-white hover:bg-navy-800 disabled:opacity-40"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => void record()}
              disabled={
                (busy && operation !== "recording") || available !== true
              }
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-2 disabled:opacity-40 ${operation === "recording" ? "border-red-300 bg-red-50 text-red-800" : "border-slate-300 hover:bg-amber-50"}`}
            >
              {operation === "recording" ? (
                <Square size={16} />
              ) : (
                <Mic size={16} />
              )}
              {operation === "recording"
                ? text("Stop recording", "ध्वनिमुद्रण थांबवा")
                : text("Ask by voice", "बोलून विचारा")}
            </button>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={voiceReplies}
                onChange={(event) => setVoiceReplies(event.target.checked)}
                className="accent-amber-700"
              />
              {text("Read replies aloud", "उत्तरे ऐकवा")}
            </label>
            {busy ? (
              <button
                type="button"
                onClick={cancel}
                className="rounded p-2 font-semibold underline"
              >
                {text("Cancel", "रद्द करा")}
              </button>
            ) : (
              messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    cancel();
                    setMessages([]);
                    setDraft("");
                    setError("");
                    setNotice("");
                  }}
                  className="rounded p-2 underline"
                >
                  {text("New chat", "नवे संभाषण")}
                </button>
              )
            )}
          </div>
        </form>
      </div>
    </dialog>
  );
}
