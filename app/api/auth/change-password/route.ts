import { auth } from "@/auth";
import { compare, hash } from "bcryptjs";
import { findUserById, updatePassword } from "@/db/queries";
import { rateLimit } from "@/lib/upstash/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = (await auth())?.user?.id;
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  const limit = await rateLimit(`change-password:${userId}`, 5, 3600);
  if (!limit.allowed) return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";
  if (newPassword.length < 8) return Response.json({ error: "Use at least eight characters." }, { status: 400 });
  if (currentPassword === newPassword) return Response.json({ error: "Choose a different password." }, { status: 400 });
  const user = await findUserById(userId);
  if (!user || !(await compare(currentPassword, user.passwordHash))) {
    return Response.json({ error: "The current password was not right." }, { status: 400 });
  }
  await updatePassword(userId, await hash(newPassword, 12));
  return Response.json({ ok: true });
}
