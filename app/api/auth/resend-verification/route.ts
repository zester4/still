import { auth } from "@/auth";
import { createEmailVerificationToken, findUserById } from "@/db/queries";
import { rateLimit } from "@/lib/upstash/server";
import { sendVerificationEmail } from "@/lib/email/server";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  const limit = await rateLimit(`verification:${userId}`, 3, 3600);
  if (!limit.allowed) return Response.json({ error: "Too many requests. Try again later." }, { status: 429 });
  const user = await findUserById(userId);
  if (!user) return Response.json({ error: "Account not found." }, { status: 404 });
  if (user.emailVerifiedAt) return Response.json({ ok: true, alreadyVerified: true });
  try {
    const token = await createEmailVerificationToken(user.id);
    await sendVerificationEmail({ email: user.email, name: user.name, token });
  } catch (error) {
    console.error("[auth] verification email failed", error);
    return Response.json({ error: "Email delivery is not configured yet." }, { status: 503 });
  }
  return Response.json({ ok: true });
}
