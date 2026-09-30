import { createPasswordResetToken } from "@/db/queries";

export const runtime = "nodejs";

function appUrl() {
  return (
    process.env.APP_URL?.trim().replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

async function sendResetEmail(input: { email: string; name: string; token: string }) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) throw new Error("Password recovery email is not configured.");

  const link = `${appUrl()}/reset-password?token=${encodeURIComponent(input.token)}`;
  const greeting = input.name ? `Hi ${input.name},` : "Hi,";
  const text = `${greeting}\n\nSomeone asked to reset the password for your Still account. This link expires in one hour:\n\n${link}\n\nIf you did not ask for this, you can ignore this email. No changes have been made.`;
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#0e0d0b;color:#f3efe6;font-family:Arial,sans-serif"><main style="max-width:560px;margin:0 auto;padding:40px 24px"><p style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#9c9688">Still</p><h1 style="font-size:28px;font-weight:500">Reset your Still password</h1><p style="font-size:16px;line-height:1.6">${greeting}</p><p style="font-size:16px;line-height:1.6">Someone asked to reset the password for your account. This link expires in one hour.</p><p style="margin:28px 0"><a href="${link}" style="display:inline-block;padding:14px 20px;background:#d8d2c4;color:#0e0d0b;text-decoration:none;border-radius:8px;font-weight:600">Reset password</a></p><p style="font-size:13px;line-height:1.6;color:#9c9688">If you did not ask for this, you can ignore this email. No changes have been made.</p></main></body></html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [input.email], subject: "Reset your Still password", text, html }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend error ${response.status}: ${detail.slice(0, 160)}`);
  }
}

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@") || email.length > 120) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const reset = await createPasswordResetToken(email);
  if (!reset) return Response.json({ ok: true });

  try {
    await sendResetEmail(reset);
  } catch (error) {
    console.error("[auth] password reset email failed", error);
    return Response.json({ error: "Password recovery is not configured yet." }, { status: 503 });
  }
  return Response.json({ ok: true });
}
