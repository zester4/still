import { hash } from "bcryptjs";
import { createEmailVerificationToken, createUser, findUserByEmail } from "@/db/queries";
import { rateLimit } from "@/lib/upstash/server";
import { sendVerificationEmail } from "@/lib/email/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await rateLimit(`register:${forwarded}`, 8, 3600);
  if (!limit.allowed) return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  let body: { name?: string; email?: string; password?: string };
  try {
    body = (await request.json()) as { name?: string; email?: string; password?: string };
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = (body.name ?? "").trim().slice(0, 40);
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !email.includes("@") || email.length > 120) {
    return Response.json({ error: "A real email is needed." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Use at least eight characters." }, { status: 400 });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return Response.json({ error: "That email already has a space here. Sign in instead." }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);
  const user = await createUser({
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
  });

  let verificationSent = false;
  try {
    const token = await createEmailVerificationToken(user.id);
    await sendVerificationEmail({ email: user.email, name: user.name, token });
    verificationSent = true;
  } catch (error) {
    console.error("[auth] verification email failed", error);
  }

  return Response.json({ id: user.id, email: user.email, name: user.name, verificationSent });
}
