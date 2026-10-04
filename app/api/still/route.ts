import { auth } from "@/auth";
import {
  applyCloudSyncOperations,
  eraseUserData,
  loadSnapshot,
} from "@/db/queries";
import {
  deleteAllMemoryVectors,
  deleteMemoryVector,
  upsertMemoryVector,
} from "@/lib/upstash/server";
import type { CloudSyncRequest } from "@/lib/store/cloud-sync";

export const runtime = "nodejs";

async function requireUserId() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return id;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  const snapshot = await loadSnapshot(userId);
  return Response.json({ snapshot });
}

export async function PUT() {
  return Response.json(
    { error: "Snapshot sync is retired. Reload Still to use row-level sync." },
    { status: 410 },
  );
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });

  let body: CloudSyncRequest;
  try {
    body = (await request.json()) as CloudSyncRequest;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!Array.isArray(body.operations) || body.operations.length === 0) {
    return Response.json({ applied: 0 });
  }
  if (body.operations.length > 500) {
    return Response.json({ error: "Too many changes" }, { status: 413 });
  }

  const applied = await applyCloudSyncOperations(userId, body.operations);
  for (const operation of body.operations) {
    if (operation.type === "memory") {
      void upsertMemoryVector(userId, operation.memory).catch((error) => {
        console.error("[memory] vector sync failed", error);
      });
    }
    if (operation.type === "delete_memory") {
      void deleteMemoryVector(userId, operation.id).catch((error) => {
        console.error("[memory] vector delete failed", error);
      });
    }
  }
  return Response.json({ applied });
}

export async function DELETE() {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  await eraseUserData(userId);
  try {
    await deleteAllMemoryVectors(userId);
  } catch (error) {
    console.error("[memory] vector erase failed", error);
    return Response.json({ error: "The account could not be fully erased yet." }, { status: 503 });
  }
  return Response.json({ ok: true });
}
