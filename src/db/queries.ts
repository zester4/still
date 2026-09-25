import { eq } from "drizzle-orm";
import { getDb } from "./config";
import {
  checkInEntries,
  conversations,
  letters,
  memories,
  messages,
  profiles,
  pulses,
  users,
} from "./schema";
import type {
  CheckInEntry,
  CheckInFrequency,
  Conversation,
  Letter,
  MemoryItem,
  PulseEntry,
  StillState,
} from "@/lib/companion/types";

export type StillSnapshot = Omit<StillState, "hydrated">;

export type UserRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
};

export async function createUser(input: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserRow> {
  const db = await getDb();
  const email = input.email.trim().toLowerCase();
  const rows = await db
    .insert(users)
    .values({
      id: input.id,
      name: input.name.trim(),
      email,
      passwordHash: input.passwordHash,
    })
    .returning();
  const user = rows[0];
  await db.insert(profiles).values({
    userId: user.id,
    displayName: input.name.trim(),
  });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
  };
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  const user = rows[0];
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
  };
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const user = rows[0];
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
  };
}

function emptySnapshot(): StillSnapshot {
  return {
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
    createdAt: new Date().toISOString(),
  };
}

export async function loadSnapshot(userId: string): Promise<StillSnapshot> {
  const db = await getDb();
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const convoRows = await db.select().from(conversations).where(eq(conversations.userId, userId));
  const messageRows = await db.select().from(messages).where(eq(messages.userId, userId));
  const memoryRows = await db.select().from(memories).where(eq(memories.userId, userId));
  const letterRows = await db.select().from(letters).where(eq(letters.userId, userId));
  const checkRows = await db.select().from(checkInEntries).where(eq(checkInEntries.userId, userId));
  const pulseRows = await db.select().from(pulses).where(eq(pulses.userId, userId));

  if (!profile && convoRows.length === 0) return emptySnapshot();

  const byConvo = new Map<string, Conversation>();
  const sortedConvos = [...convoRows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  for (const c of sortedConvos) {
    byConvo.set(c.id, {
      id: c.id,
      startedAt: c.startedAt,
      updatedAt: c.updatedAt,
      pulseAsked: c.pulseAsked,
      messages: [],
    });
  }
  const sortedMessages = [...messageRows].sort((a, b) => {
    if (a.conversationId !== b.conversationId) return a.conversationId.localeCompare(b.conversationId);
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.createdAt.localeCompare(b.createdAt);
  });
  for (const m of sortedMessages) {
    const convo = byConvo.get(m.conversationId);
    if (!convo) continue;
    convo.messages.push({
      id: m.id,
      role: m.role as "user" | "companion",
      content: m.content,
      createdAt: m.createdAt,
      intent: (m.intent as Conversation["messages"][number]["intent"]) ?? undefined,
      crisis: m.crisis || undefined,
    });
  }

  const snapshot: StillSnapshot = {
    onboarded: profile?.onboarded ?? false,
    name: profile?.displayName ?? "",
    concerns: profile?.concerns ?? [],
    conversations: sortedConvos.map((c) => byConvo.get(c.id)!),
    activeConversationId: sortedConvos[0]?.id ?? null,
    memories: memoryRows.map(
      (m): MemoryItem => ({
        id: m.id,
        kind: m.kind as MemoryItem["kind"],
        title: m.title,
        detail: m.detail,
        source: m.source as MemoryItem["source"],
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }),
    ),
    letters: letterRows.map(
      (l): Letter => ({
        id: l.id,
        to: l.to,
        body: l.body,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      }),
    ),
    checkIns: {
      enabled: profile?.checkInsEnabled ?? false,
      frequency: (profile?.checkInFrequency as CheckInFrequency) ?? "few",
      lastShownAt: profile?.lastShownAt ?? null,
      lastAnsweredAt: profile?.lastAnsweredAt ?? null,
      entries: checkRows.map(
        (e): CheckInEntry => ({
          id: e.id,
          at: e.at,
          mood: e.mood as CheckInEntry["mood"],
          note: e.note,
        }),
      ),
    },
    pulses: pulseRows.map(
      (p): PulseEntry => ({
        id: p.id,
        conversationId: p.conversationId,
        at: p.at,
        value: p.value as PulseEntry["value"],
      }),
    ),
    createdAt: profile?.createdAt ?? new Date().toISOString(),
  };
  return snapshot;
}

export async function saveSnapshot(userId: string, snap: StillSnapshot): Promise<void> {
  const db = await getDb();

  await db
    .insert(profiles)
    .values({
      userId,
      displayName: snap.name,
      concerns: snap.concerns,
      onboarded: snap.onboarded,
      checkInsEnabled: snap.checkIns.enabled,
      checkInFrequency: snap.checkIns.frequency,
      lastShownAt: snap.checkIns.lastShownAt,
      lastAnsweredAt: snap.checkIns.lastAnsweredAt,
      createdAt: snap.createdAt,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        displayName: snap.name,
        concerns: snap.concerns,
        onboarded: snap.onboarded,
        checkInsEnabled: snap.checkIns.enabled,
        checkInFrequency: snap.checkIns.frequency,
        lastShownAt: snap.checkIns.lastShownAt,
        lastAnsweredAt: snap.checkIns.lastAnsweredAt,
      },
    });

  await db.delete(messages).where(eq(messages.userId, userId));
  await db.delete(conversations).where(eq(conversations.userId, userId));
  await db.delete(memories).where(eq(memories.userId, userId));
  await db.delete(letters).where(eq(letters.userId, userId));
  await db.delete(checkInEntries).where(eq(checkInEntries.userId, userId));
  await db.delete(pulses).where(eq(pulses.userId, userId));

  if (snap.conversations.length) {
    await db.insert(conversations).values(
      snap.conversations.map((c) => ({
        id: c.id,
        userId,
        startedAt: c.startedAt,
        updatedAt: c.updatedAt,
        pulseAsked: Boolean(c.pulseAsked),
      })),
    );
    const allMessages = snap.conversations.flatMap((c) =>
      c.messages.map((m, i) => ({
        id: m.id,
        userId,
        conversationId: c.id,
        role: m.role,
        content: m.content,
        intent: m.intent ?? null,
        crisis: Boolean(m.crisis),
        createdAt: m.createdAt,
        sortOrder: i,
      })),
    );
    if (allMessages.length) await db.insert(messages).values(allMessages);
  }

  if (snap.memories.length) {
    await db.insert(memories).values(
      snap.memories.map((m) => ({
        id: m.id,
        userId,
        kind: m.kind,
        title: m.title,
        detail: m.detail,
        source: m.source,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
    );
  }

  if (snap.letters.length) {
    await db.insert(letters).values(
      snap.letters.map((l) => ({
        id: l.id,
        userId,
        to: l.to,
        body: l.body,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      })),
    );
  }

  if (snap.checkIns.entries.length) {
    await db.insert(checkInEntries).values(
      snap.checkIns.entries.map((e) => ({
        id: e.id,
        userId,
        at: e.at,
        mood: e.mood,
        note: e.note,
      })),
    );
  }

  if (snap.pulses.length) {
    await db.insert(pulses).values(
      snap.pulses.map((p) => ({
        id: p.id,
        userId,
        conversationId: p.conversationId,
        at: p.at,
        value: p.value,
      })),
    );
  }
}

export async function eraseUserData(userId: string): Promise<void> {
  await saveSnapshot(userId, emptySnapshot());
}
