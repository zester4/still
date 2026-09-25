import { auth } from "@/auth";
import { eraseUserData, loadSnapshot, saveSnapshot, type StillSnapshot } from "@/db/queries";

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

export async function PUT(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  let body: { snapshot?: StillSnapshot };
  try {
    body = (await request.json()) as { snapshot?: StillSnapshot };
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body.snapshot) return Response.json({ error: "Missing snapshot" }, { status: 400 });
  await saveSnapshot(userId, body.snapshot);
  return Response.json({ ok: true });
}

export async function DELETE() {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  await eraseUserData(userId);
  return Response.json({ ok: true });
}
