"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useStillStore } from "@/lib/store/still-store";
import type { StillState } from "@/lib/companion/types";
import { diffCloudSnapshots, type CloudSnapshot } from "@/lib/store/cloud-sync";

type SyncSnapshot = CloudSnapshot;

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
    preferences: s.preferences,
    notifications: s.notifications,
    pulses: s.pulses,
    createdAt: s.createdAt,
  };
}

export function HydrateStill() {
  const { status } = useSession();
  const cloudReady = useRef(false);
  const cloudSnapshot = useRef<SyncSnapshot | null>(null);
  const syncTimer = useRef<number | undefined>(undefined);
  const syncQueue = useRef(Promise.resolve());

  useEffect(() => {
    // Older releases persisted the complete journal under this key. Remove it
    // on the next visit; current releases keep journal rows only in the cloud.
    try {
      window.localStorage.removeItem("still-companion");
    } catch {
      /* storage can be unavailable in strict privacy modes */
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      cloudReady.current = false;
      cloudSnapshot.current = null;
      useStillStore.getState().resetForCloudLoad();
      useStillStore.getState().setHydrated();
      return;
    }

    let cancelled = false;
    cloudReady.current = false;
    cloudSnapshot.current = null;
    useStillStore.getState().resetForCloudLoad();
    void (async () => {
      try {
        const response = await fetch("/api/still");
        if (!response.ok) return;
        const data = (await response.json()) as { snapshot?: Omit<StillState, "hydrated"> };
        if (cancelled || !data.snapshot) return;
        cloudSnapshot.current = {
          ...data.snapshot,
          activeConversationId: data.snapshot.activeConversationId ?? null,
          letters: data.snapshot.letters ?? [],
          notifications: data.snapshot.notifications ?? [],
        };
        useStillStore.getState().replaceFromCloud(data.snapshot);
        cloudReady.current = true;
      } catch (error) {
        console.error("[still] cloud hydration failed", error);
      } finally {
        if (!cancelled) useStillStore.getState().setHydrated();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const scheduleSync = () => {
      window.clearTimeout(syncTimer.current);
      syncTimer.current = window.setTimeout(() => {
        if (!cloudReady.current || !cloudSnapshot.current || !useStillStore.getState().hydrated)
          return;
        const target = snapshotOf(useStillStore.getState());
        const operations = diffCloudSnapshots(cloudSnapshot.current, target);
        if (!operations.length) return;

        syncQueue.current = syncQueue.current
          .then(async () => {
            const response = await fetch("/api/still", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ operations }),
            });
            if (!response.ok) throw new Error(`Cloud sync failed (${response.status})`);
            cloudSnapshot.current = target;
          })
          .catch((error) => {
            console.error("[still] incremental sync failed", error);
            window.clearTimeout(syncTimer.current);
            syncTimer.current = window.setTimeout(scheduleSync, 1500);
          });
      }, 500);
    };

    const unsubscribe = useStillStore.subscribe((state) => {
      if (!state.hydrated || !cloudReady.current) return;
      scheduleSync();
    });
    return () => {
      unsubscribe();
      window.clearTimeout(syncTimer.current);
    };
  }, [status]);

  return null;
}
