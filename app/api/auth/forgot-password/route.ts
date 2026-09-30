import { createElement } from "react";
import { render } from "react-email";
import { createPasswordResetToken } from "@/db/queries";
import { PasswordResetEmail } from "@/components/email/password-reset";

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
  const email = createElement(PasswordResetEmail, { name: input.name, resetUrl: link });
  const [html, text] = await Promise.all([render(email), render(email, { plainText: true })]);

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
