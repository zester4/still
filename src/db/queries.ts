import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { getDb } from "./config";
import {
  checkInEntries,
  conversations,
  letters,
  memories,
  messages,
  notifications,
  profiles,
  pulses,
  passwordResetTokens,
  users,
  checkInSchedules,
  conversationSummaries,
  emailVerificationTokens,
  weeklyReflections,
} from "./schema";
import type {
  CheckInEntry,
  CheckInFrequency,
  Conversation,
  Letter,
  MemoryItem,
  PulseEntry,
  StillState,
  ConversationSummary,
  WeeklyReflection,
} from "@/lib/companion/types";
import type { NotificationItem, NotificationKind, StillPreferences } from "@/lib/companion/types";
import type { CloudSyncOperation } from "@/lib/store/cloud-sync";

export type StillSnapshot = Omit<StillState, "hydrated">;

export type UserRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  emailVerifiedAt: string | null;
  sessionVersion: number;
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
    emailVerifiedAt: user.emailVerifiedAt,
    sessionVersion: user.sessionVersion,
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
    emailVerifiedAt: user.emailVerifiedAt,
    sessionVersion: user.sessionVersion,
  };
}

export async function createEmailVerificationToken(userId: string) {
  const db = await getDb();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
  await db.insert(emailVerificationTokens).values({
    id: crypto.randomUUID(),
    userId,
    tokenHash: hashResetToken(token),
    expiresAt,
  });
  return token;
}

export async function verifyEmailToken(token: string): Promise<boolean> {
  const db = await getDb();
  const now = new Date().toISOString();
  const [row] = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, hashResetToken(token)),
        isNull(emailVerificationTokens.usedAt),
        gt(emailVerificationTokens.expiresAt, now),
      ),
    )
    .limit(1);
  if (!row) return false;
  await db
    .update(emailVerificationTokens)
    .set({ usedAt: now })
    .where(and(eq(emailVerificationTokens.id, row.id), isNull(emailVerificationTokens.usedAt)));
  const [claimed] = await db
    .select({ id: emailVerificationTokens.id })
    .from(emailVerificationTokens)
    .where(and(eq(emailVerificationTokens.id, row.id), eq(emailVerificationTokens.usedAt, now)))
    .limit(1);
  if (!claimed) return false;
  await db.update(users).set({ emailVerifiedAt: now }).where(eq(users.id, row.userId));
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, row.userId));
  return true;
}

export async function updatePassword(userId: string, passwordHash: string) {
  const db = await getDb();
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId));
}

export async function revokeAllSessions(userId: string) {
  const db = await getDb();
  const [user] = await db
    .select({ sessionVersion: users.sessionVersion })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return;
  await db
    .update(users)
    .set({ sessionVersion: user.sessionVersion + 1, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId));
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
    emailVerifiedAt: user.emailVerifiedAt,
    sessionVersion: user.sessionVersion,
  };
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(email: string) {
  const db = await getDb();
  const normalized = email.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  if (!user) return null;

  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
  await db.insert(passwordResetTokens).values({
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash: hashResetToken(token),
    expiresAt,
  });
  return { token, email: user.email, name: user.name };
}

export async function resetPassword(token: string, passwordHash: string): Promise<boolean> {
  const db = await getDb();
  const now = new Date().toISOString();
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hashResetToken(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
      ),
    )
    .limit(1);
  if (!row) return false;

  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(and(eq(passwordResetTokens.id, row.id), isNull(passwordResetTokens.usedAt)));
  const [claimed] = await db
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.id, row.id), eq(passwordResetTokens.usedAt, now)))
    .limit(1);
  if (!claimed) return false;

  await db
    .update(users)
    .set({ passwordHash, sessionVersion: sql`${users.sessionVersion} + 1`, updatedAt: now })
    .where(eq(users.id, row.userId));
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row.userId));
  return true;
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
    preferences: {
      memoryEnabled: true,
      notificationsEnabled: false,
      emailNotificationsEnabled: false,
      timezone: "UTC",
      checkInTime: "20:00",
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
    },
    notifications: [],
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
  const notificationRows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId));

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
    if (a.conversationId !== b.conversationId)
      return a.conversationId.localeCompare(b.conversationId);
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
    memories: memoryRows.map((m): MemoryItem => ({
      id: m.id,
      kind: m.kind as MemoryItem["kind"],
      title: m.title,
      detail: m.detail,
      source: m.source as MemoryItem["source"],
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    })),
    letters: letterRows.map((l): Letter => ({
      id: l.id,
      to: l.to,
      body: l.body,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    })),
    checkIns: {
      enabled: profile?.checkInsEnabled ?? false,
      frequency: (profile?.checkInFrequency as CheckInFrequency) ?? "few",
      lastShownAt: profile?.lastShownAt ?? null,
      lastAnsweredAt: profile?.lastAnsweredAt ?? null,
      entries: checkRows.map((e): CheckInEntry => ({
        id: e.id,
        at: e.at,
        mood: e.mood as CheckInEntry["mood"],
        note: e.note,
      })),
    },
    preferences: {
      memoryEnabled: profile?.memoryEnabled ?? true,
      notificationsEnabled: profile?.notificationsEnabled ?? false,
      emailNotificationsEnabled: profile?.emailNotificationsEnabled ?? false,
      timezone: profile?.timezone ?? "UTC",
      checkInTime: profile?.checkInTime ?? "20:00",
      quietHoursStart: profile?.quietHoursStart ?? "22:00",
      quietHoursEnd: profile?.quietHoursEnd ?? "08:00",
    },
    notifications: notificationRows
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50)
      .map((n): NotificationItem => ({
        id: n.id,
        kind: n.kind as NotificationKind,
        title: n.title,
        body: n.body,
        href: n.href,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
    pulses: pulseRows.map((p): PulseEntry => ({
      id: p.id,
      conversationId: p.conversationId,
      at: p.at,
      value: p.value as PulseEntry["value"],
    })),
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
      memoryEnabled: snap.preferences.memoryEnabled,
      notificationsEnabled: snap.preferences.notificationsEnabled,
      emailNotificationsEnabled: snap.preferences.emailNotificationsEnabled,
      timezone: snap.preferences.timezone,
      checkInTime: snap.preferences.checkInTime,
      quietHoursStart: snap.preferences.quietHoursStart,
      quietHoursEnd: snap.preferences.quietHoursEnd,
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
        memoryEnabled: snap.preferences.memoryEnabled,
        notificationsEnabled: snap.preferences.notificationsEnabled,
        emailNotificationsEnabled: snap.preferences.emailNotificationsEnabled,
        timezone: snap.preferences.timezone,
        checkInTime: snap.preferences.checkInTime,
        quietHoursStart: snap.preferences.quietHoursStart,
        quietHoursEnd: snap.preferences.quietHoursEnd,
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

/**
 * Apply only the rows that changed in the browser. This deliberately does not
 * derive deletes from a client snapshot: another tab may have rows this tab
 * has never seen. Every operation is scoped by userId and is safe to retry.
 */
export async function applyCloudSyncOperations(
  userId: string,
  operations: CloudSyncOperation[],
): Promise<number> {
  const db = await getDb();
  let applied = 0;

  for (const operation of operations.slice(0, 500)) {
    switch (operation.type) {
      case "profile": {
        const profile = operation.profile;
        await db
          .insert(profiles)
          .values({
            userId,
            displayName: profile.name.slice(0, 120),
            concerns: profile.concerns.slice(0, 20),
            onboarded: profile.onboarded,
            checkInsEnabled: profile.checkIns.enabled,
            checkInFrequency: profile.checkIns.frequency,
            memoryEnabled: profile.preferences.memoryEnabled,
            notificationsEnabled: profile.preferences.notificationsEnabled,
            emailNotificationsEnabled: profile.preferences.emailNotificationsEnabled,
            timezone: profile.preferences.timezone.slice(0, 80),
            checkInTime: profile.preferences.checkInTime,
            quietHoursStart: profile.preferences.quietHoursStart,
            quietHoursEnd: profile.preferences.quietHoursEnd,
            lastShownAt: profile.checkIns.lastShownAt,
            lastAnsweredAt: profile.checkIns.lastAnsweredAt,
          })
          .onConflictDoUpdate({
            target: profiles.userId,
            set: {
              displayName: profile.name.slice(0, 120),
              concerns: profile.concerns.slice(0, 20),
              onboarded: profile.onboarded,
              checkInsEnabled: profile.checkIns.enabled,
              checkInFrequency: profile.checkIns.frequency,
              memoryEnabled: profile.preferences.memoryEnabled,
              notificationsEnabled: profile.preferences.notificationsEnabled,
              emailNotificationsEnabled: profile.preferences.emailNotificationsEnabled,
              timezone: profile.preferences.timezone.slice(0, 80),
              checkInTime: profile.preferences.checkInTime,
              quietHoursStart: profile.preferences.quietHoursStart,
              quietHoursEnd: profile.preferences.quietHoursEnd,
              lastShownAt: profile.checkIns.lastShownAt,
              lastAnsweredAt: profile.checkIns.lastAnsweredAt,
            },
          });
        applied += 1;
        break;
      }
      case "conversation": {
        const conversation = operation.conversation;
        await db
          .insert(conversations)
          .values({
            id: conversation.id,
            userId,
            startedAt: conversation.startedAt,
            updatedAt: conversation.updatedAt,
            pulseAsked: Boolean(conversation.pulseAsked),
          })
          .onConflictDoNothing({ target: conversations.id });
        await db
          .update(conversations)
          .set({
            startedAt: conversation.startedAt,
            updatedAt: conversation.updatedAt,
            pulseAsked: Boolean(conversation.pulseAsked),
          })
          .where(and(eq(conversations.id, conversation.id), eq(conversations.userId, userId)));
        applied += 1;
        break;
      }
      case "message": {
        const message = operation.message;
        const [ownedConversation] = await db
          .select({ id: conversations.id })
          .from(conversations)
          .where(
            and(eq(conversations.id, operation.conversationId), eq(conversations.userId, userId)),
          )
          .limit(1);
        if (!ownedConversation) break;
        await db
          .insert(messages)
          .values({
            id: message.id,
            userId,
            conversationId: operation.conversationId,
            role: message.role,
            content: message.content.slice(0, 12000),
            intent: message.intent ?? null,
            crisis: Boolean(message.crisis),
            createdAt: message.createdAt,
            sortOrder: Math.max(0, Math.min(operation.sortOrder, 1000000)),
          })
          .onConflictDoNothing({ target: messages.id });
        await db
          .update(messages)
          .set({
            conversationId: operation.conversationId,
            role: message.role,
            content: message.content.slice(0, 12000),
            intent: message.intent ?? null,
            crisis: Boolean(message.crisis),
            createdAt: message.createdAt,
            sortOrder: Math.max(0, Math.min(operation.sortOrder, 1000000)),
          })
          .where(and(eq(messages.id, message.id), eq(messages.userId, userId)));
        applied += 1;
        break;
      }
      case "memory": {
        const memory = operation.memory;
        await db
          .insert(memories)
          .values({
            id: memory.id,
            userId,
            kind: memory.kind,
            title: memory.title.slice(0, 160),
            detail: memory.detail.slice(0, 1200),
            source: memory.source,
            createdAt: memory.createdAt,
            updatedAt: memory.updatedAt,
          })
          .onConflictDoNothing({ target: memories.id });
        await db
          .update(memories)
          .set({
            kind: memory.kind,
            title: memory.title.slice(0, 160),
            detail: memory.detail.slice(0, 1200),
            source: memory.source,
            createdAt: memory.createdAt,
            updatedAt: memory.updatedAt,
          })
          .where(and(eq(memories.id, memory.id), eq(memories.userId, userId)));
        applied += 1;
        break;
      }
      case "delete_memory":
        await db
          .delete(memories)
          .where(and(eq(memories.id, operation.id), eq(memories.userId, userId)));
        applied += 1;
        break;
      case "letter": {
        const letter = operation.letter;
        await db
          .insert(letters)
          .values({
            id: letter.id,
            userId,
            to: letter.to.slice(0, 160),
            body: letter.body.slice(0, 12000),
            createdAt: letter.createdAt,
            updatedAt: letter.updatedAt,
          })
          .onConflictDoNothing({ target: letters.id });
        await db
          .update(letters)
          .set({
            to: letter.to.slice(0, 160),
            body: letter.body.slice(0, 12000),
            createdAt: letter.createdAt,
            updatedAt: letter.updatedAt,
          })
          .where(and(eq(letters.id, letter.id), eq(letters.userId, userId)));
        applied += 1;
        break;
      }
      case "delete_letter":
        await db
          .delete(letters)
          .where(and(eq(letters.id, operation.id), eq(letters.userId, userId)));
        applied += 1;
        break;
      case "check_in":
        await db
          .insert(checkInEntries)
          .values({
            id: operation.entry.id,
            userId,
            at: operation.entry.at,
            mood: operation.entry.mood,
            note: operation.entry.note.slice(0, 2000),
          })
          .onConflictDoNothing({ target: checkInEntries.id });
        applied += 1;
        break;
      case "pulse":
        await db
          .insert(pulses)
          .values({
            id: operation.pulse.id,
            userId,
            conversationId: operation.pulse.conversationId,
            at: operation.pulse.at,
            value: operation.pulse.value,
          })
          .onConflictDoNothing({ target: pulses.id });
        applied += 1;
        break;
    }
  }

  return applied;
}

export type NotificationInput = {
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
};

export async function createNotification(
  userId: string,
  input: NotificationInput,
): Promise<NotificationItem> {
  const db = await getDb();
  const [row] = await db
    .insert(notifications)
    .values({
      id: crypto.randomUUID(),
      userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      href: input.href ?? "/talk",
    })
    .returning();
  return {
    id: row.id,
    kind: row.kind as NotificationKind,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

export async function listNotifications(userId: string): Promise<NotificationItem[]> {
  const db = await getDb();
  const rows = await db.select().from(notifications).where(eq(notifications.userId, userId));
  return rows
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50)
    .map((n) => ({
      id: n.id,
      kind: n.kind as NotificationKind,
      title: n.title,
      body: n.body,
      href: n.href,
      readAt: n.readAt,
      createdAt: n.createdAt,
    }));
}

export async function markNotificationsRead(userId: string, ids?: string[]): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  if (!ids?.length) {
    await db.update(notifications).set({ readAt: now }).where(eq(notifications.userId, userId));
    return;
  }
  for (const id of ids.slice(0, 100)) {
    await db
      .update(notifications)
      .set({ readAt: now })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }
}

export async function getPreferences(userId: string): Promise<StillPreferences> {
  const db = await getDb();
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return {
    memoryEnabled: profile?.memoryEnabled ?? true,
    notificationsEnabled: profile?.notificationsEnabled ?? false,
    emailNotificationsEnabled: profile?.emailNotificationsEnabled ?? false,
    timezone: profile?.timezone ?? "UTC",
    checkInTime: profile?.checkInTime ?? "20:00",
    quietHoursStart: profile?.quietHoursStart ?? "22:00",
    quietHoursEnd: profile?.quietHoursEnd ?? "08:00",
  };
}

export async function savePreferences(
  userId: string,
  patch: Partial<StillPreferences>,
): Promise<StillPreferences> {
  const current = await getPreferences(userId);
  const next = { ...current, ...patch };
  const db = await getDb();
  await db
    .insert(profiles)
    .values({ userId, displayName: "", ...next })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        memoryEnabled: next.memoryEnabled,
        notificationsEnabled: next.notificationsEnabled,
        emailNotificationsEnabled: next.emailNotificationsEnabled,
        timezone: next.timezone,
        checkInTime: next.checkInTime,
        quietHoursStart: next.quietHoursStart,
        quietHoursEnd: next.quietHoursEnd,
      },
    });
  return next;
}

export async function getCheckInSchedule(userId: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(checkInSchedules)
    .where(eq(checkInSchedules.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function saveCheckInSchedule(input: {
  userId: string;
  qstashScheduleId?: string | null;
  frequency: string;
  enabled: boolean;
  timezone: string;
  checkInTime: string;
}) {
  const db = await getDb();
  const now = new Date().toISOString();
  const [row] = await db
    .insert(checkInSchedules)
    .values({ id: crypto.randomUUID(), ...input, updatedAt: now })
    .onConflictDoUpdate({
      target: checkInSchedules.userId,
      set: { ...input, updatedAt: now },
    })
    .returning();
  return row;
}

export async function markCheckInSent(userId: string, at = new Date().toISOString()) {
  const db = await getDb();
  await db
    .update(checkInSchedules)
    .set({ lastSentAt: at, updatedAt: at })
    .where(eq(checkInSchedules.userId, userId));
}

export async function saveConversationSummary(input: {
  userId: string;
  conversationId: string;
  summary: string;
  highlights: string[];
  messageCount: number;
}): Promise<ConversationSummary> {
  const db = await getDb();
  const now = new Date().toISOString();
  const [row] = await db
    .insert(conversationSummaries)
    .values({ id: crypto.randomUUID(), ...input, updatedAt: now })
    .onConflictDoUpdate({
      target: conversationSummaries.conversationId,
      set: {
        summary: input.summary,
        highlights: input.highlights,
        messageCount: input.messageCount,
        updatedAt: now,
      },
    })
    .returning();
  return {
    id: row.id,
    conversationId: row.conversationId,
    summary: row.summary,
    highlights: row.highlights ?? [],
    messageCount: row.messageCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listConversationSummaries(userId: string): Promise<ConversationSummary[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(conversationSummaries)
    .where(eq(conversationSummaries.userId, userId));
  return rows
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((row) => ({
      id: row.id,
      conversationId: row.conversationId,
      summary: row.summary,
      highlights: row.highlights ?? [],
      messageCount: row.messageCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
}

export async function getWeeklyReflection(
  userId: string,
  weekStart: string,
): Promise<WeeklyReflection | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(weeklyReflections)
    .where(and(eq(weeklyReflections.userId, userId), eq(weeklyReflections.weekStart, weekStart)))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    weekStart: row.weekStart,
    summary: row.summary,
    highlights: row.highlights ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function saveWeeklyReflection(input: {
  userId: string;
  weekStart: string;
  summary: string;
  highlights: string[];
}): Promise<WeeklyReflection> {
  const db = await getDb();
  const now = new Date().toISOString();
  const [row] = await db
    .insert(weeklyReflections)
    .values({ id: crypto.randomUUID(), ...input, updatedAt: now })
    .onConflictDoUpdate({
      target: [weeklyReflections.userId, weeklyReflections.weekStart],
      set: { summary: input.summary, highlights: input.highlights, updatedAt: now },
    })
    .returning();
  return {
    id: row.id,
    weekStart: row.weekStart,
    summary: row.summary,
    highlights: row.highlights ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function eraseUserData(userId: string): Promise<void> {
  const db = await getDb();
  await db.delete(users).where(eq(users.id, userId));
}
