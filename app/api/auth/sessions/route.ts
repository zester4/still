import { auth } from "@/auth";
import { findUserById, revokeAllSessions } from "@/db/queries";

export const runtime = "nodejs";

export async function GET() {
  const userId = (await auth())?.user?.id;
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  const user = await findUserById(userId);
  if (!user) return Response.json({ error: "Account not found." }, { status: 404 });
  return Response.json({ session: { signedIn: true, email: user.email, lastUpdatedAt: user.sessionVersion } });
}

export async function DELETE() {
  const userId = (await auth())?.user?.id;
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  await revokeAllSessions(userId);
  return Response.json({ ok: true });
}
