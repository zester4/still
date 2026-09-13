import { useEffect } from "react";
import { useStillStore } from "@/lib/store/still-store";

export function HydrateStill() {
  useEffect(() => {
    const mark = () => useStillStore.getState().setHydrated();
    const unsub = useStillStore.persist.onFinishHydration(mark);
    if (useStillStore.persist.hasHydrated()) mark();
    const fallback = window.setTimeout(mark, 800);
    return () => {
      unsub();
      window.clearTimeout(fallback);
    };
  }, []);
  return null;
}
