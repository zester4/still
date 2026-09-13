import { detectCrisis } from "./safety";
import type { ChatTurn, Intent, MemoryItem } from "./types";

const ADVICE = /\b(what should i|what do i do|advice|help me|how do i|any ideas|can you (help|tell)|tell me what)\b/i;
const CHECKIN = /^(hi|hey|hello|yo|morning|evening|good night)\b|\b(checking in|just checking|i['’]?m (ok|okay|fine|alright|here))\b/i;
const REFLECT = /\b(i (think|wonder|guess|suppose)|maybe i|i['’]ve been thinking|on one hand|part of me)\b/i;

export function classifyLocal(message: string): Intent {
  if (detectCrisis(message)) return "escalating-risk";
  if (ADVICE.test(message)) return "seeking-advice";
  if (CHECKIN.test(message.trim())) return "check-in";
  if (REFLECT.test(message)) return "reflecting";
  return "venting";
}

function snippet(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  const clauses = clean
    .split(/[,.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
  const raw = clauses[clauses.length - 1] || clean;
  const words = raw.split(" ");
  const piece = words.length > 9 ? words.slice(-8).join(" ") : raw;
  return piece.replace(/^[a-z]/, (c) => c); // keep original casing
}

function pick<T>(seed: string, items: T[]): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return items[h % items.length]!;
}

function memoryNudge(memories: MemoryItem[], message: string): string {
  const lower = message.toLowerCase();
  const hit = memories.find(
    (m) =>
      m.title.length > 2 &&
      (lower.includes(m.title.toLowerCase()) ||
        m.detail.toLowerCase().split(" ").some((w) => w.length > 4 && lower.includes(w))),
  );
  if (!hit) return "";
  return pick(message, [
    ` You mentioned ${hit.title.toLowerCase()} before — is this sitting in the same place?`,
    ` That brushes against ${hit.title.toLowerCase()}, if I'm remembering right.`,
  ]);
}

export function localCompanionReply(input: {
  message: string;
  name: string;
  intent: Intent;
  memories: MemoryItem[];
  history: ChatTurn[];
}): string {
  const bit = snippet(input.message);
  const name = input.name.trim();
  const you = name || "you";
  const mem = memoryNudge(input.memories, input.message);
  const night = /\b(night|sleep|2am|3am|insomnia|awake)\b/i.test(input.message);

  if (input.intent === "seeking-advice") {
    return pick(input.message, [
      `I won't pretend there's one right move. Two small options: write the loop down so it has a page instead of a skull, or name the worry out loud to me and we'll look at it together. Which feels less impossible?`,
      `Advice sits better when it's small. You could give this ${night ? "night" : "hour"} one job — not solving it, just staying with the next twenty minutes. Or we can think through one piece of "${bit}" if you want company in it.`,
    ]);
  }

  if (input.intent === "check-in") {
    return pick(input.message, [
      `Hi${name ? ` ${name}` : ""}. I'm here. No need to make it a report — what's actually present?`,
      `Glad you came by. We can go slow. What's sitting closest to the surface?`,
    ]);
  }

  if (input.intent === "reflecting") {
    return pick(input.message, [
      `You're already turning it over. "${bit}" — what happens if you let that sentence be true for a minute, without deciding what it means yet?`,
      `That sounds like two parts of you talking at once. Which one is louder right now, and which one do you wish had the floor?`,
    ]);
  }

  // venting — default
  const lines = [
    `That's a long stretch to sit with. "${bit}" doesn't have to be tidy to be real.${mem} What keeps looping when it gets quiet?`,
    `I'm with you in this. ${night ? "Nights make everything sound more certain than it is." : "You don't have to make it smaller for me."} What's the part that feels heaviest?`,
    `Heard. Not as a problem to solve first — as something that's here. ${you === "you" ? "You" : you} don't have to carry the whole thing in one message. Where should we stay?`,
    `That's a lot to hold at once. I'm not going to tidy it. If you want, tell me the sentence that keeps coming back.`,
    `Work-worry at 2am has a way of sounding like a verdict. It usually isn't. What would you say to a friend who brought you "${bit}"?`,
  ];
  if (!night) {
    lines.pop();
  }
  return pick(input.message + String(input.history.length), lines);
}

export function localUnavailableNote() {
  return "The full companion model isn't reachable just now, so I'm staying with a simpler listener on this device. I can still sit with you — and if this is a hard moment, a person is better. iasp.info/suicidalthoughts, or 988 in the US.";
}
