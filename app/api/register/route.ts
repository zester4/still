import { hash } from "bcryptjs";
import { createUser, findUserByEmail } from "@/db/queries";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  return Response.json({ id: user.id, email: user.email, name: user.name });
}
