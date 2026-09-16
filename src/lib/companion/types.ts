export type ChatTurn = { role: "user" | "companion"; content: string };

export const INTENTS = [
  "venting",
  "seeking-advice",
  "reflecting",
  "check-in",
  "escalating-risk",
] as const;

export type Intent = (typeof INTENTS)[number];

export type MemoryKind = "theme" | "person" | "situation" | "coping" | "goal";

export type Mood = "heavy" | "mixed" | "lighter" | "unsure";

export type PulseValue = "yes" | "somewhat" | "not-really";

export type CheckInFrequency = "daily" | "few" | "weekly";

export interface MemoryItem {
  id: string;
  kind: MemoryKind;
  title: string;
  detail: string;
  createdAt: string;
  updatedAt: string;
  source: "you" | "still";
}

export interface ChatMessage {
  id: string;
  role: "user" | "companion";
  content: string;
  createdAt: string;
  intent?: Intent;
  crisis?: boolean;
}

export interface Conversation {
  id: string;
  startedAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  pulseAsked?: boolean;
}

export interface CheckInEntry {
  id: string;
  at: string;
  mood: Mood;
  note: string;
}

export interface PulseEntry {
  id: string;
  at: string;
  value: PulseValue;
  conversationId: string;
}

export interface Letter {
  id: string;
  to: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface StillState {
  hydrated: boolean;
  onboarded: boolean;
  name: string;
  concerns: string[];
  conversations: Conversation[];
  activeConversationId: string | null;
  memories: MemoryItem[];
  letters: Letter[];
  checkIns: {
    enabled: boolean;
    frequency: CheckInFrequency;
    lastShownAt: string | null;
    lastAnsweredAt: string | null;
    entries: CheckInEntry[];
  };
  pulses: PulseEntry[];
  createdAt: string;
}

export const CONCERN_OPTIONS = [
  { id: "low-mood", label: "Low mood" },
  { id: "loneliness", label: "Loneliness" },
  { id: "overwhelm", label: "Overwhelm" },
  { id: "nights", label: "Hard nights" },
  { id: "talk", label: "Just need to talk" },
  { id: "unsure", label: "Not sure yet" },
] as const;

export const MEMORY_KIND_LABEL: Record<MemoryKind, string> = {
  theme: "Recurring theme",
  person: "Person",
  situation: "Situation",
  coping: "What helped",
  goal: "A goal you set",
};

export const INTENT_LABEL: Record<Intent, string> = {
  venting: "Letting it out",
  "seeking-advice": "Looking for a way through",
  reflecting: "Thinking it through",
  "check-in": "Checking in",
  "escalating-risk": "A hard moment",
};

export const MOOD_LABEL: Record<Mood, string> = {
  heavy: "Heavy",
  mixed: "Mixed",
  lighter: "A little lighter",
  unsure: "Not sure",
};
