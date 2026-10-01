import { auth } from "@/auth";
import { getOrCreateWeeklyReflection } from "@/lib/companion/reflections.server";

export const runtime = "nodejs";

export async function GET() {
  const userId = (await auth())?.user?.id;
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  return Response.json({ reflection: await getOrCreateWeeklyReflection(userId) });
}

export async function POST() {
  const userId = (await auth())?.user?.id;
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  return Response.json({ reflection: await getOrCreateWeeklyReflection(userId, true) });
}
