import { auth } from "@/auth";
import { listNotifications, markNotificationsRead } from "@/db/queries";

export const runtime = "nodejs";

async function userId() {
  return (await auth())?.user?.id ?? null;
}

export async function GET() {
  const id = await userId();
  if (!id) return Response.json({ error: "Sign in first." }, { status: 401 });
  return Response.json({ notifications: await listNotifications(id) });
}

export async function PATCH(request: Request) {
  const id = await userId();
  if (!id) return Response.json({ error: "Sign in first." }, { status: 401 });
  let body: { ids?: string[] } = {};
  try {
    body = (await request.json()) as { ids?: string[] };
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  await markNotificationsRead(id, body.ids);
  return Response.json({ notifications: await listNotifications(id) });
}
