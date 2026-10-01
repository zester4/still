import { createElement, type ReactElement } from "react";
import { render } from "react-email";
import { VerifyEmail } from "@/components/email/verify-email";
import { appUrl } from "@/lib/upstash/server";

export async function sendStillEmail(input: {
  to: string;
  subject: string;
  element: ReactElement;
}) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) throw new Error("Email is not configured.");
  const [html, text] = await Promise.all([render(input.element), render(input.element, { plainText: true })]);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html, text }),
  });
  if (!response.ok) throw new Error(`Email provider error ${response.status}`);
}

export async function sendVerificationEmail(input: { email: string; name: string; token: string }) {
  const verifyUrl = `${appUrl()}/verify-email?token=${encodeURIComponent(input.token)}`;
  await sendStillEmail({
    to: input.email,
    subject: "Confirm your Still email",
    element: createElement(VerifyEmail, { name: input.name, verifyUrl }),
  });
}
