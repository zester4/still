import { verifyEmailToken } from "@/db/queries";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { token?: string };
  try {
    body = (await request.json()) as { token?: string };
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const token = (body.token ?? "").trim();
  if (!token || token.length > 200) return Response.json({ error: "This link is invalid." }, { status: 400 });
  const verified = await verifyEmailToken(token);
  if (!verified) return Response.json({ error: "This link is invalid or expired." }, { status: 400 });
  return Response.json({ ok: true });
}
