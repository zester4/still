import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
};

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  ...timestamps,
}, (t) => [uniqueIndex("users_email_idx").on(t.email)]);

export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull().default(""),
  concerns: jsonb("concerns").$type<string[]>().notNull().default([]),
  onboarded: boolean("onboarded").notNull().default(false),
  checkInsEnabled: boolean("check_ins_enabled").notNull().default(false),
  checkInFrequency: text("check_in_frequency").notNull().default("few"),
  lastShownAt: text("last_shown_at"),
  lastAnsweredAt: text("last_answered_at"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startedAt: text("started_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    pulseAsked: boolean("pulse_asked").notNull().default(false),
  },
  (t) => [index("conversations_user_id_idx").on(t.userId)],
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    intent: text("intent"),
    crisis: boolean("crisis").notNull().default(false),
    createdAt: text("created_at").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("messages_user_id_idx").on(t.userId),
    index("messages_conversation_id_idx").on(t.conversationId),
  ],
);

export const memories = pgTable(
  "memories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    detail: text("detail").notNull().default(""),
    source: text("source").notNull().default("you"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("memories_user_id_idx").on(t.userId)],
);

export const letters = pgTable(
  "letters",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    to: text("to").notNull().default(""),
    body: text("body").notNull().default(""),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("letters_user_id_idx").on(t.userId)],
);

export const checkInEntries = pgTable(
  "check_in_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    at: text("at").notNull(),
    mood: text("mood").notNull(),
    note: text("note").notNull().default(""),
  },
  (t) => [index("check_in_entries_user_id_idx").on(t.userId)],
);

export const pulses = pgTable(
  "pulses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id").notNull(),
    at: text("at").notNull(),
    value: text("value").notNull(),
  },
  (t) => [index("pulses_user_id_idx").on(t.userId)],
);
