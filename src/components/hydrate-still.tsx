"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useStillStore } from "@/lib/store/still-store";
import type { StillState } from "@/lib/companion/types";

function snapshotOf(s: StillState) {
  return {
    onboarded: s.onboarded,
    name: s.name,
    concerns: s.concerns,
    conversations: s.conversations,
    activeConversationId: s.activeConversationId,
    memories: s.memories,
    letters: s.letters,
    checkIns: s.checkIns,
    pulses: s.pulses,
    createdAt: s.createdAt,
  };
}

export function HydrateStill() {
  const { status } = useSession();
  const cloudReady = useRef(false);
  const skipNext = useRef(false);

  useEffect(() => {
    const mark = () => useStillStore.getState().setHydrated();
    const unsub = useStillStore.persist.onFinishHydration(mark);
    if (useStillStore.persist.hasHydrated()) mark();
    else void useStillStore.persist.rehydrate();
    const fallback = window.setTimeout(mark, 800);
    return () => {
      unsub();
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      cloudReady.current = false;
      return;
    }
    let cancelled = false;
    cloudReady.current = false;
    void (async () => {
      try {
        const res = await fetch("/api/still");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { snapshot?: ReturnType<typeof snapshotOf> };
        if (data.snapshot) {
          skipNext.current = true;
          useStillStore.getState().replaceFromCloud(data.snapshot);
        }
      } finally {
        if (!cancelled) cloudReady.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let timer: number | undefined;
    const unsub = useStillStore.subscribe((s) => {
      if (!cloudReady.current || !s.hydrated) return;
      if (skipNext.current) {
        skipNext.current = false;
        return;
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const snap = snapshotOf(useStillStore.getState());
        void fetch("/api/still", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snapshot: snap }),
        });
      }, 700);
    });
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, [status]);

  return null;
}
