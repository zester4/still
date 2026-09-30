import { Client as QStashClient, Receiver } from "@upstash/qstash";
import { Redis } from "@upstash/redis";
import { Index } from "@upstash/vector";
import type { MemoryItem, StillPreferences } from "@/lib/companion/types";

type MemoryMetadata = {
  userId: string;
  memoryId: string;
  kind: string;
  title: string;
  detail: string;
  source: string;
};

const globalRef = globalThis as typeof globalThis & {
  __stillRedis__?: Redis;
  __stillVector__?: Index<MemoryMetadata>;
  __stillQstash__?: QStashClient;
};

function env(name: string) {
  return process.env[name]?.trim() || "";
}

export function getRedis(): Redis | null {
  const url = env("UPSTASH_REDIS_REST_URL") || env("KV_REST_API_URL");
  const token = env("UPSTASH_REDIS_REST_TOKEN") || env("KV_REST_API_TOKEN");
  if (!url || !token) return null;
  globalRef.__stillRedis__ ??= new Redis({ url, token });
  return globalRef.__stillRedis__;
}

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const redis = getRedis();
  if (!redis) return { allowed: true, remaining: limit };
  try {
    const bucket = `still:rate:${key}`;
    const count = await redis.incr(bucket);
    if (count === 1) await redis.expire(bucket, windowSeconds);
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    return { allowed: true, remaining: limit };
  }
}

export async function claimOnce(key: string, ttlSeconds: number) {
  const redis = getRedis();
  if (!redis) return true;
  const result = await redis.set(`still:once:${key}`, "1", { nx: true, ex: ttlSeconds });
  return result === "OK";
}

function getVector() {
  const url = env("UPSTASH_VECTOR_REST_URL");
  const token = env("UPSTASH_VECTOR_REST_TOKEN");
  if (!url || !token) return null;
  globalRef.__stillVector__ ??= new Index<MemoryMetadata>({ url, token });
  return globalRef.__stillVector__;
}

export async function upsertMemoryVector(userId: string, memory: MemoryItem) {
  const index = getVector();
  if (!index) return false;
  await index.namespace(userId).upsert([
    {
      id: memory.id,
      data: `${memory.title}. ${memory.detail}`,
      metadata: {
        userId,
        memoryId: memory.id,
        kind: memory.kind,
        title: memory.title,
        detail: memory.detail,
        source: memory.source,
      },
    },
  ]);
  return true;
}

export async function syncMemoryVectors(userId: string, memories: MemoryItem[]) {
  const index = getVector();
  if (!index) return false;
  const namespace = index.namespace(userId);
  await namespace.reset();
  if (memories.length) {
    await namespace.upsert(
      memories.map((memory) => ({
        id: memory.id,
        data: `${memory.title}. ${memory.detail}`,
        metadata: {
          userId,
          memoryId: memory.id,
          kind: memory.kind,
          title: memory.title,
          detail: memory.detail,
          source: memory.source,
        },
      })),
    );
  }
  return true;
}

export async function deleteMemoryVector(userId: string, memoryId: string) {
  const index = getVector();
  if (!index) return false;
  await index.namespace(userId).delete(memoryId);
  return true;
}

export async function deleteAllMemoryVectors(userId: string) {
  const index = getVector();
  if (!index) return false;
  await index.namespace(userId).reset();
  return true;
}

export async function searchMemoryVectors(userId: string, query: string, topK = 6): Promise<MemoryItem[]> {
  const index = getVector();
  if (!index || !query.trim()) return [];
  try {
    const results = await index.namespace(userId).query({ data: query, topK, includeMetadata: true });
    return results
      .map((result) => {
        const metadata = result.metadata;
        if (!metadata) return null;
        return {
          id: metadata.memoryId,
          kind: metadata.kind as MemoryItem["kind"],
          title: metadata.title,
          detail: metadata.detail,
          source: metadata.source as MemoryItem["source"],
          createdAt: "",
          updatedAt: "",
        } satisfies MemoryItem;
      })
      .filter((item): item is MemoryItem => Boolean(item));
  } catch {
    return [];
  }
}

export function getQStash(): QStashClient | null {
  const token = env("QSTASH_TOKEN");
  if (!token) return null;
  globalRef.__stillQstash__ ??= new QStashClient({ token });
  return globalRef.__stillQstash__;
}

export function appUrl() {
  return (
    env("APP_URL").replace(/\/$/, "") ||
    (env("VERCEL_URL") ? `https://${env("VERCEL_URL")}` : "http://localhost:3000")
  );
}

function cronForTime(time: string) {
  const [_hour, minute] = time.split(":").map(Number);
  const safeMinute = Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0;
  return `${safeMinute} * * * *`;
}

export async function scheduleCheckIn(input: {
  userId: string;
  checkInTime: StillPreferences["checkInTime"];
  scheduleId?: string | null;
}) {
  const client = getQStash();
  if (!client) return null;
  const result = await client.schedules.create({
    scheduleId: input.scheduleId ?? undefined,
    destination: `${appUrl()}/api/jobs/check-in`,
    body: JSON.stringify({ userId: input.userId }),
    headers: { "Content-Type": "application/json" },
    cron: cronForTime(input.checkInTime),
    retries: 3,
  });
  return result.scheduleId;
}

export async function deleteCheckInSchedule(scheduleId: string | null | undefined) {
  if (!scheduleId) return;
  const client = getQStash();
  if (client) await client.schedules.delete(scheduleId);
}

export async function verifyQStash(request: Request, body: string) {
  const current = env("QSTASH_CURRENT_SIGNING_KEY");
  const next = env("QSTASH_NEXT_SIGNING_KEY");
  if (!current || !next) return false;
  const signature = request.headers.get("upstash-signature");
  if (!signature) return false;
  const receiver = new Receiver({ currentSigningKey: current, nextSigningKey: next });
  return receiver.verify({ signature, body });
}
