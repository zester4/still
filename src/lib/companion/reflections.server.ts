import { createNotification, getWeeklyReflection, loadSnapshot, saveWeeklyReflection } from "@/db/queries";
import type { Mood, WeeklyReflection } from "@/lib/companion/types";

function mondayUtc(date = new Date()) {
  const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = value.getUTCDay();
  value.setUTCDate(value.getUTCDate() - (day === 0 ? 6 : day - 1));
  return value.toISOString().slice(0, 10);
}

const moodWords: Record<Mood, string> = {
  heavy: "heavy",
  mixed: "mixed",
  lighter: "a little lighter",
  unsure: "uncertain",
};

export async function getOrCreateWeeklyReflection(userId: string, force = false): Promise<WeeklyReflection> {
  const weekStart = mondayUtc();
  const existing = await getWeeklyReflection(userId, weekStart);
  const snapshot = await loadSnapshot(userId);
  const since = Date.now() - 7 * 86_400_000;
  const recentTalks = snapshot.conversations.filter((conversation) => new Date(conversation.updatedAt).getTime() >= since && conversation.messages.some((message) => message.role === "user"));
  const recentCheckIns = snapshot.checkIns.entries.filter((entry) => new Date(entry.at).getTime() >= since);
  const latestActivity = Math.max(
    ...recentTalks.map((conversation) => new Date(conversation.updatedAt).getTime()),
    ...recentCheckIns.map((entry) => new Date(entry.at).getTime()),
    0,
  );
  if (existing && !force && new Date(existing.updatedAt).getTime() >= latestActivity) return existing;
  const highlights = [
    ...recentCheckIns.slice(0, 2).map((entry) => `You described the week as ${moodWords[entry.mood]}.`),
    ...recentTalks.slice(0, 2).map((conversation) => conversation.messages.find((message) => message.role === "user")?.content.replace(/\s+/g, " ").slice(0, 140)).filter((value): value is string => Boolean(value)).map((value) => `You made room for: “${value}”`),
  ].slice(0, 3);
  const summary = recentTalks.length === 0 && recentCheckIns.length === 0
    ? "There is not enough here for a reflection yet. A few talks or check-ins will give the week a shape."
    : `This week held ${recentTalks.length} ${recentTalks.length === 1 ? "talk" : "talks"} and ${recentCheckIns.length} ${recentCheckIns.length === 1 ? "check-in" : "check-ins"}. This is a record of what you shared, not a score or a diagnosis.`;
  const reflection = await saveWeeklyReflection({ userId, weekStart, summary, highlights });
  if (!existing && (recentTalks.length || recentCheckIns.length)) {
    await createNotification(userId, {
      kind: "reflection",
      title: "Your weekly reflection is ready",
      body: "A small look back at what you shared this week.",
      href: "/patterns",
    });
  }
  return reflection;
}
