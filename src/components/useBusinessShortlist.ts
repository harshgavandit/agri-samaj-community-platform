"use client";

import type { publicBusiness } from "@/lib/business";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type DirectoryBusiness = ReturnType<typeof publicBusiness>;

export function useBusinessShortlist(includeBusinesses = false) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [businesses, setBusinesses] = useState<DirectoryBusiness[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [unavailableCount, setUnavailableCount] = useState(0);
  const [clearingUnavailable, setClearingUnavailable] = useState(false);
  const clearPending = useRef(false);
  const pending = useRef(new Set<string>());
  const alive = useRef(true);

  const refresh = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const auth = await fetch("/api/auth/me", { signal, cache: "no-store" });
        if (!auth.ok)
          throw new Error("Unable to check your account. Please try again.");
        const session = await auth.json();
        if (signal.aborted) return;
        setAuthenticated(Boolean(session.authenticated));
        if (!session.authenticated) {
          setSavedIds(new Set());
          setBusinesses([]);
          return;
        }
        const response = await fetch(
          `/api/saved-businesses${includeBusinesses ? "" : "?view=ids"}`,
          { signal, cache: "no-store" },
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Unable to load saved businesses.");
        if (signal.aborted) return;
        setSavedIds(new Set(data.savedIds));
        setUnavailableCount(data.unavailableCount || 0);
        if (includeBusinesses) setBusinesses(data.businesses);
      } catch (cause) {
        if (!signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load saved businesses.",
          );
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [includeBusinesses],
  );

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => {
      alive.current = false;
      controller.abort();
    };
  }, [refresh, revision]);

  const toggle = async (businessId: string) => {
    if (authenticated === false) {
      router.push(
        `/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
      return;
    }
    if (!authenticated || pending.current.has(businessId)) return;
    pending.current.add(businessId);
    setPendingIds(new Set(pending.current));
    setError("");
    try {
      const remove = savedIds.has(businessId);
      const response = await fetch(
        `/api/saved-businesses/${encodeURIComponent(businessId)}`,
        { method: remove ? "DELETE" : "PUT" },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Unable to update your saved businesses.",
        );
      if (!alive.current) return;
      setSavedIds((previous) => {
        const next = new Set(previous);
        if (data.saved) next.add(businessId);
        else next.delete(businessId);
        return next;
      });
      if (!data.saved)
        setBusinesses((previous) =>
          previous.filter((business) => business.id !== businessId),
        );
    } catch (cause) {
      if (alive.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to update your saved businesses.",
        );
    } finally {
      pending.current.delete(businessId);
      if (alive.current) setPendingIds(new Set(pending.current));
    }
  };

  const removeUnavailable = async () => {
    if (!authenticated || clearPending.current) return;
    clearPending.current = true;
    setClearingUnavailable(true);
    setError("");
    try {
      const response = await fetch("/api/saved-businesses", {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Unable to remove unavailable saved listings.",
        );
      if (alive.current) setRevision((value) => value + 1);
    } catch (cause) {
      if (alive.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to update your shortlist.",
        );
    } finally {
      clearPending.current = false;
      if (alive.current) setClearingUnavailable(false);
    }
  };

  return {
    authenticated,
    businesses,
    savedIds,
    loading,
    pendingIds,
    error,
    toggle,
    retry: () => setRevision((value) => value + 1),
    unavailableCount,
    clearingUnavailable,
    removeUnavailable,
  };
}
