import { createElement } from "react";
import { render } from "react-email";
import { createNotification, findUserById, getCheckInSchedule, getPreferences, markCheckInSent } from "@/db/queries";
import { appUrl, claimOnce, verifyQStash } from "@/lib/upstash/server";
import { CheckInEmail } from "@/components/email/check-in";

export const runtime = "nodejs";

function localTime(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(new Date());
  return {
    hour: Number(parts.find((part) => part.type === "hour")?.value ?? 0),
    minute: Number(parts.find((part) => part.type === "minute")?.value ?? 0),
  };
}

function daysSince(value: string | null) {
  if (!value) return Infinity;
  return (Date.now() - new Date(value).getTime()) / 86_400_000;
}

function inQuietHours(now: { hour: number }, start: string, end: string) {
  const current = now.hour * 60;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const from = startHour * 60 + startMinute;
  const to = endHour * 60 + endMinute;
  if (from === to) return false;
  return from < to ? current >= from && current < to : current >= from || current < to;
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!(await verifyQStash(request, raw))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body: { userId?: string };
  try {
    body = JSON.parse(raw) as { userId?: string };
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body.userId) return Response.json({ error: "Missing user" }, { status: 400 });

  const schedule = await getCheckInSchedule(body.userId);
  const preferences = await getPreferences(body.userId);
  if (!schedule?.enabled || !preferences.notificationsEnabled) return Response.json({ skipped: true });

  const [targetHour] = schedule.checkInTime.split(":").map(Number);
  const now = localTime(schedule.timezone);
  if (now.hour !== targetHour) {
    return Response.json({ skipped: true });
  }
  if (inQuietHours(now, preferences.quietHoursStart, preferences.quietHoursEnd)) {
    return Response.json({ skipped: true });
  }
  const minimumDays = schedule.frequency === "daily" ? 1 : schedule.frequency === "weekly" ? 7 : 3;
  if (daysSince(schedule.lastSentAt) < minimumDays) return Response.json({ skipped: true });
  if (!(await claimOnce(`check-in:${body.userId}:${new Date().toISOString().slice(0, 10)}`, 86_400))) {
    return Response.json({ skipped: true });
  }

  await createNotification(body.userId, {
    kind: "check-in",
    title: "A quiet check-in",
    body: "How is today sitting with you? You can answer, write a little, or leave it for later.",
    href: "/check-ins",
  });
  if (preferences.emailNotificationsEnabled && process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    try {
      const user = await findUserById(body.userId);
      if (user) {
        const email = createElement(CheckInEmail, {
          name: user.name,
          checkInUrl: `${appUrl()}/check-ins`,
        });
        const [html, text] = await Promise.all([render(email), render(email, { plainText: true })]);
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: [user.email],
            subject: "A quiet check-in from Still",
            html,
            text,
          }),
        });
      }
    } catch (error) {
      console.error("[notifications] check-in email failed", error);
    }
  }
  await markCheckInSent(body.userId);
  return Response.json({ ok: true });
}
