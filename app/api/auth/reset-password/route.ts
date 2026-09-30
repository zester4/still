import { hash } from "bcryptjs";
import { resetPassword } from "@/db/queries";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
