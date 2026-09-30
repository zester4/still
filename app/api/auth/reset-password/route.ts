import { hash } from "bcryptjs";
import { resetPassword } from "@/db/queries";
import { rateLimit } from "@/lib/upstash/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await rateLimit(`password-reset-confirm:${forwarded}`, 12, 3600);
  if (!limit.allowed) return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  let body: { token?: string; password?: string };
  try {
    body = (await request.json()) as { token?: string; password?: string };
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const password = body.password ?? "";
  if (!token) return Response.json({ error: "This reset link is missing." }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Use at least eight characters." }, { status: 400 });

  const changed = await resetPassword(token, await hash(password, 12));
  if (!changed) return Response.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  return Response.json({ ok: true });
}
