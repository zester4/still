import assert from "node:assert/strict";
import test from "node:test";
import { diffCloudSnapshots, type CloudSnapshot } from "./cloud-sync.ts";

function snapshot(overrides: Partial<CloudSnapshot> = {}): CloudSnapshot {
  return {
    onboarded: true,
    name: "Seyyid",
    concerns: ["nights"],
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
    createdAt: "2026-10-04T00:00:00.000Z",
    ...overrides,
  };
}

test("sync diff sends only a new message instead of replacing other conversations", () => {
  const oldConversation = {
    id: "old",
    startedAt: "2026-10-03T20:00:00.000Z",
    updatedAt: "2026-10-03T20:02:00.000Z",
    messages: [
      {
        id: "old-message",
        role: "user" as const,
        content: "A night before",
        createdAt: "2026-10-03T20:01:00.000Z",
      },
    ],
  };
  const newConversation = {
    id: "new",
    startedAt: "2026-10-04T00:00:00.000Z",
    updatedAt: "2026-10-04T00:01:00.000Z",
    messages: [
      {
        id: "new-message",
        role: "user" as const,
        content: "Tonight is difficult",
        createdAt: "2026-10-04T00:01:00.000Z",
      },
    ],
  };

  const operations = diffCloudSnapshots(
    snapshot({ conversations: [oldConversation] }),
    snapshot({ conversations: [newConversation, oldConversation] }),
  );

  assert.deepEqual(
    operations.map((operation) => operation.type),
    ["conversation", "message"],
  );
  assert.equal(operations[1]?.type, "message");
  if (operations[1]?.type === "message") assert.equal(operations[1].message.id, "new-message");
});

test("sync diff represents edits and explicit deletes as row operations", () => {
  const previous = snapshot({
    memories: [
      {
        id: "memory-1",
        kind: "theme",
        title: "Hard nights",
        detail: "Old detail",
        source: "you",
        createdAt: "2026-10-03T00:00:00.000Z",
        updatedAt: "2026-10-03T00:00:00.000Z",
      },
    ],
    letters: [
      {
        id: "letter-1",
        to: "myself",
        body: "A draft",
        createdAt: "2026-10-03T00:00:00.000Z",
        updatedAt: "2026-10-03T00:00:00.000Z",
      },
    ],
  });
  const next = snapshot({
    memories: [
      { ...previous.memories[0], detail: "New detail", updatedAt: "2026-10-04T00:00:00.000Z" },
    ],
  });

  assert.deepEqual(
    diffCloudSnapshots(previous, next).map((operation) => operation.type),
    ["memory", "delete_letter"],
  );
});
