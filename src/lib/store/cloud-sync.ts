import type {
  CheckInEntry,
  ChatMessage,
  Conversation,
  Letter,
  MemoryItem,
  PulseEntry,
  StillPreferences,
  StillState,
} from "../companion/types";

export type CloudSnapshot = Omit<StillState, "hydrated">;

export type CloudProfile = {
  name: string;
  concerns: string[];
  onboarded: boolean;
  checkIns: {
    enabled: boolean;
    frequency: "daily" | "few" | "weekly";
    lastShownAt: string | null;
    lastAnsweredAt: string | null;
  };
  preferences: StillPreferences;
};

export type CloudSyncOperation =
  | { type: "profile"; profile: CloudProfile }
  | { type: "conversation"; conversation: Omit<Conversation, "messages"> }
  | { type: "message"; conversationId: string; message: ChatMessage; sortOrder: number }
  | { type: "memory"; memory: MemoryItem }
  | { type: "delete_memory"; id: string }
  | { type: "letter"; letter: Letter }
  | { type: "delete_letter"; id: string }
  | { type: "check_in"; entry: CheckInEntry }
  | { type: "pulse"; pulse: PulseEntry };

export type CloudSyncRequest = { operations: CloudSyncOperation[] };

function profileOf(snapshot: CloudSnapshot): CloudProfile {
  return {
    name: snapshot.name,
    concerns: snapshot.concerns,
    onboarded: snapshot.onboarded,
    checkIns: {
      enabled: snapshot.checkIns.enabled,
      frequency: snapshot.checkIns.frequency,
      lastShownAt: snapshot.checkIns.lastShownAt,
      lastAnsweredAt: snapshot.checkIns.lastAnsweredAt,
    },
    preferences: snapshot.preferences,
  };
}

function same(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function diffCloudSnapshots(
  previous: CloudSnapshot,
  next: CloudSnapshot,
): CloudSyncOperation[] {
  const operations: CloudSyncOperation[] = [];
  if (!same(profileOf(previous), profileOf(next))) {
    operations.push({ type: "profile", profile: profileOf(next) });
  }

  const previousConversations = new Map(
    previous.conversations.map((conversation) => [conversation.id, conversation]),
  );
  for (const conversation of next.conversations) {
    const prior = previousConversations.get(conversation.id);
    const { messages: _priorMessages, ...previousRow } = prior ?? conversation;
    const { messages: _nextMessages, ...nextRow } = conversation;
    void _priorMessages;
    void _nextMessages;
    if (!prior || !same(previousRow, nextRow)) {
      operations.push({ type: "conversation", conversation: nextRow });
    }

    const previousMessages = new Map(
      (prior?.messages ?? []).map((message) => [message.id, message]),
    );
    conversation.messages.forEach((message, sortOrder) => {
      if (!previousMessages.has(message.id) || !same(previousMessages.get(message.id), message)) {
        operations.push({ type: "message", conversationId: conversation.id, message, sortOrder });
      }
    });
  }

  const previousMemories = new Map(previous.memories.map((memory) => [memory.id, memory]));
  for (const memory of next.memories) {
    if (!previousMemories.has(memory.id) || !same(previousMemories.get(memory.id), memory)) {
      operations.push({ type: "memory", memory });
    }
  }
  for (const memory of previous.memories) {
    if (!next.memories.some((item) => item.id === memory.id)) {
      operations.push({ type: "delete_memory", id: memory.id });
    }
  }

  const previousLetters = new Map(previous.letters.map((letter) => [letter.id, letter]));
  for (const letter of next.letters) {
    if (!previousLetters.has(letter.id) || !same(previousLetters.get(letter.id), letter)) {
      operations.push({ type: "letter", letter });
    }
  }
  for (const letter of previous.letters) {
    if (!next.letters.some((item) => item.id === letter.id)) {
      operations.push({ type: "delete_letter", id: letter.id });
    }
  }

  const previousCheckIns = new Map(previous.checkIns.entries.map((entry) => [entry.id, entry]));
  for (const entry of next.checkIns.entries) {
    if (!previousCheckIns.has(entry.id) || !same(previousCheckIns.get(entry.id), entry)) {
      operations.push({ type: "check_in", entry });
    }
  }

  const previousPulses = new Map(previous.pulses.map((pulse) => [pulse.id, pulse]));
  for (const pulse of next.pulses) {
    if (!previousPulses.has(pulse.id) || !same(previousPulses.get(pulse.id), pulse)) {
      operations.push({ type: "pulse", pulse });
    }
  }

  return operations;
}
