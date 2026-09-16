import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid, nowIso } from "@/lib/utils";
import type {
  CheckInFrequency,
  ChatMessage,
  CheckInEntry,
  Conversation,
  Intent,
  Letter,
  MemoryItem,
  Mood,
  PulseValue,
  StillState,
} from "@/lib/companion/types";

const CHECKIN_MS: Record<CheckInFrequency, number> = {
  daily: 20 * 60 * 60 * 1000,
  few: 60 * 60 * 60 * 1000,
  weekly: 6 * 24 * 60 * 60 * 1000,
};

type StillActions = {
  setHydrated: () => void;
  completeOnboarding: (input: {
    name: string;
    concerns: string[];
    checkInsEnabled: boolean;
    frequency: CheckInFrequency;
  }) => void;
  setName: (name: string) => void;
  ensureConversation: () => string;
  startNewPage: () => string;
  addMessage: (conversationId: string, message: Omit<ChatMessage, "id" | "createdAt"> & { id?: string }) => string;
  updateMessage: (conversationId: string, messageId: string, patch: Partial<ChatMessage>) => void;
  appendToMessage: (conversationId: string, messageId: string, chunk: string) => void;
  markPulseAsked: (conversationId: string) => void;
  addMemories: (items: Omit<MemoryItem, "id" | "createdAt" | "updatedAt">[]) => MemoryItem[];
  upsertMemory: (item: MemoryItem) => void;
  deleteMemory: (id: string) => void;
  openConversation: (id: string) => void;
  upsertLetter: (item: Letter) => void;
  deleteLetter: (id: string) => void;
  setCheckIns: (patch: Partial<StillState["checkIns"]>) => void;
  snoozeCheckIn: () => void;
  answerCheckIn: (mood: Mood, note: string) => void;
  addPulse: (conversationId: string, value: PulseValue) => void;
  exportData: () => string;
  wipeAll: () => void;
};

const emptyState = (): Omit<StillState, "hydrated"> => ({
  onboarded: false,
  name: "",
  concerns: [],
  conversations: [],
  activeConversationId: null,
  memories: [],
  letters: [],
  checkIns: {
    enabled: false,
    frequency: "few",
    lastShownAt: null,
    lastAnsweredAt: null,
    entries: [],
  },
  pulses: [],
  createdAt: nowIso(),
});

export const useStillStore = create<StillState & StillActions>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...emptyState(),

      setHydrated: () => set({ hydrated: true }),

      completeOnboarding: ({ name, concerns, checkInsEnabled, frequency }) => {
        const convoId = uid();
        const greeting: ChatMessage = {
          id: uid(),
          role: "companion",
          content: greetingFor(name, concerns),
          createdAt: nowIso(),
          intent: "check-in",
        };
        const convo: Conversation = {
          id: convoId,
          startedAt: nowIso(),
          updatedAt: nowIso(),
          messages: [greeting],
        };
        const memories: MemoryItem[] = concerns
          .filter((c) => c !== "unsure" && c !== "talk")
          .map((c) => ({
            id: uid(),
            kind: "theme" as const,
            title: titleForConcern(c),
            detail: "You named this as present when you first arrived.",
            createdAt: nowIso(),
            updatedAt: nowIso(),
            source: "you" as const,
          }));
        set({
          onboarded: true,
          name: name.trim(),
          concerns,
          conversations: [convo],
          activeConversationId: convoId,
          memories,
          checkIns: {
            enabled: checkInsEnabled,
            frequency,
            lastShownAt: nowIso(),
            lastAnsweredAt: null,
            entries: [],
          },
        });
      },

      setName: (name) => set({ name: name.trim() }),

      ensureConversation: () => {
        const { activeConversationId, conversations } = get();
        if (activeConversationId && conversations.some((c) => c.id === activeConversationId)) {
          return activeConversationId;
        }
        return get().startNewPage();
      },

      startNewPage: () => {
        const id = uid();
        const convo: Conversation = {
          id,
          startedAt: nowIso(),
          updatedAt: nowIso(),
          messages: [],
        };
        set((s) => ({
          conversations: [convo, ...s.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      addMessage: (conversationId, message) => {
        const id = message.id ?? uid();
        const full: ChatMessage = {
          id,
          createdAt: nowIso(),
          role: message.role,
          content: message.content,
          intent: message.intent,
          crisis: message.crisis,
        };
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, updatedAt: nowIso(), messages: [...c.messages, full] }
              : c,
          ),
        }));
        return id;
      },

      updateMessage: (conversationId, messageId, patch) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id !== conversationId
              ? c
              : {
                  ...c,
                  updatedAt: nowIso(),
                  messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
                },
          ),
        }));
      },

      appendToMessage: (conversationId, messageId, chunk) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id !== conversationId
              ? c
              : {
                  ...c,
                  updatedAt: nowIso(),
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, content: m.content + chunk } : m,
                  ),
                },
          ),
        }));
      },

      markPulseAsked: (conversationId) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, pulseAsked: true } : c,
          ),
        }));
      },

      addMemories: (items) => {
        const created: MemoryItem[] = items.map((item) => ({
          ...item,
          id: uid(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }));
        if (created.length === 0) return created;
        set((s) => ({ memories: [...created, ...s.memories] }));
        return created;
      },

      upsertMemory: (item) => {
        set((s) => {
          const exists = s.memories.some((m) => m.id === item.id);
          if (exists) {
            return {
              memories: s.memories.map((m) =>
                m.id === item.id ? { ...item, updatedAt: nowIso() } : m,
              ),
            };
          }
          return { memories: [{ ...item, updatedAt: nowIso() }, ...s.memories] };
        });
      },

      deleteMemory: (id) => {
        set((s) => ({ memories: s.memories.filter((m) => m.id !== id) }));
      },

      openConversation: (id) => {
        if (get().conversations.some((c) => c.id === id)) {
          set({ activeConversationId: id });
        }
      },

      upsertLetter: (item) => {
        set((s) => {
          const letters = s.letters ?? [];
          const exists = letters.some((l) => l.id === item.id);
          if (exists) {
            return {
              letters: letters.map((l) =>
                l.id === item.id ? { ...item, updatedAt: nowIso() } : l,
              ),
            };
          }
          return { letters: [{ ...item, updatedAt: nowIso() }, ...letters] };
        });
      },

      deleteLetter: (id) => {
        set((s) => ({ letters: (s.letters ?? []).filter((l) => l.id !== id) }));
      },

      setCheckIns: (patch) => {
        set((s) => ({ checkIns: { ...s.checkIns, ...patch } }));
      },

      snoozeCheckIn: () => {
        set((s) => ({
          checkIns: { ...s.checkIns, lastShownAt: nowIso() },
        }));
      },

      answerCheckIn: (mood, note) => {
        const entry: CheckInEntry = {
          id: uid(),
          at: nowIso(),
          mood,
          note: note.trim(),
        };
        set((s) => ({
          checkIns: {
            ...s.checkIns,
            lastShownAt: nowIso(),
            lastAnsweredAt: nowIso(),
            entries: [entry, ...s.checkIns.entries],
          },
        }));
      },

      addPulse: (conversationId, value) => {
        set((s) => ({
          pulses: [
            { id: uid(), at: nowIso(), value, conversationId },
            ...s.pulses,
          ],
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, pulseAsked: true } : c,
          ),
        }));
      },

      exportData: () => {
        const s = get();
        const payload = {
          name: s.name,
          concerns: s.concerns,
          conversations: s.conversations,
          memories: s.memories,
          letters: s.letters ?? [],
          checkIns: s.checkIns,
          pulses: s.pulses,
          createdAt: s.createdAt,
          exportedAt: nowIso(),
        };
        return JSON.stringify(payload, null, 2);
      },

      wipeAll: () => {
        set({ ...emptyState(), hydrated: true, createdAt: nowIso() });
      },
    }),
    {
      name: "still-companion",
      partialize: (s) => {
        const { hydrated: _h, ...rest } = s;
        void _h;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        if (state && !state.letters) state.letters = [];
        state?.setHydrated();
      },
    },
  ),
);

export function checkInIsDue(state: StillState): boolean {
  if (!state.checkIns.enabled) return false;
  const anchor = state.checkIns.lastAnsweredAt ?? state.checkIns.lastShownAt;
  if (!anchor) return true;
  const elapsed = Date.now() - new Date(anchor).getTime();
  return elapsed >= CHECKIN_MS[state.checkIns.frequency];
}

export function lastUserTopics(state: StillState): string[] {
  return state.memories.slice(0, 3).map((m) => m.title);
}

export function intentPattern(state: StillState): Intent[] {
  const recent = state.conversations
    .flatMap((c) => c.messages)
    .filter((m) => m.role === "user" && m.intent)
    .slice(-20)
    .map((m) => m.intent!) as Intent[];
  return recent;
}

function titleForConcern(id: string) {
  switch (id) {
    case "low-mood":
      return "Low mood";
    case "loneliness":
      return "Loneliness";
    case "overwhelm":
      return "Overwhelm";
    case "nights":
      return "Hard nights";
    default:
      return id;
  }
}

function greetingFor(name: string, concerns: string[]) {
  const hello = name.trim() ? `Hi ${name.trim()}.` : "Hi.";
  const night = concerns.includes("nights");
  const lonely = concerns.includes("loneliness");
  const extra = night
    ? " Nights can feel longer than they should."
    : lonely
      ? " You don't have to explain the whole story to be here."
      : " There's no right way to start.";
  return `${hello} I'm Still — an AI companion, not a therapist, and not a substitute for a person who knows you.\n\nI'm here to listen.${extra} What's sitting with you?`;
}

export function userMessageCount(convo: Conversation | undefined) {
  if (!convo) return 0;
  return convo.messages.filter((m) => m.role === "user").length;
}
