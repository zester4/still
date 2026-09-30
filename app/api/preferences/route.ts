import { auth } from "@/auth";
import { getCheckInSchedule, getPreferences, loadSnapshot, saveCheckInSchedule, savePreferences } from "@/db/queries";
import { deleteCheckInSchedule, scheduleCheckIn } from "@/lib/upstash/server";
import type { CheckInFrequency, StillPreferences } from "@/lib/companion/types";

export const runtime = "nodejs";

async function userId() {
  return (await auth())?.user?.id ?? null;
}

function validTime(value: unknown) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validTimezone(value: unknown) {
  if (typeof value !== "string" || value.length > 80) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const id = await userId();
  if (!id) return Response.json({ error: "Sign in first." }, { status: 401 });
  return Response.json({ preferences: await getPreferences(id) });
}

export async function PUT(request: Request) {
  const id = await userId();
  if (!id) return Response.json({ error: "Sign in first." }, { status: 401 });
  let body: Partial<StillPreferences> & {
    checkInsEnabled?: boolean;
    checkInFrequency?: CheckInFrequency;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const current = await getPreferences(id);
  const patch: Partial<StillPreferences> = {
    memoryEnabled: typeof body.memoryEnabled === "boolean" ? body.memoryEnabled : current.memoryEnabled,
    notificationsEnabled:
      typeof body.notificationsEnabled === "boolean" ? body.notificationsEnabled : current.notificationsEnabled,
    emailNotificationsEnabled:
      typeof body.emailNotificationsEnabled === "boolean"
        ? body.emailNotificationsEnabled
        : current.emailNotificationsEnabled,
    timezone: validTimezone(body.timezone) ? body.timezone : current.timezone,
    checkInTime: validTime(body.checkInTime) ? body.checkInTime : current.checkInTime,
    quietHoursStart: validTime(body.quietHoursStart) ? body.quietHoursStart : current.quietHoursStart,
    quietHoursEnd: validTime(body.quietHoursEnd) ? body.quietHoursEnd : current.quietHoursEnd,
  };
  const preferences = await savePreferences(id, patch);
  const snapshot = await loadSnapshot(id);
  const enabled = body.checkInsEnabled ?? snapshot.checkIns.enabled;
  const frequency = body.checkInFrequency ?? snapshot.checkIns.frequency;
  const schedule = await getCheckInSchedule(id);
  let scheduled = false;

  if (enabled && preferences.notificationsEnabled) {
    let qstashScheduleId: string | null = null;
    try {
      qstashScheduleId = await scheduleCheckIn({
        userId: id,
        checkInTime: preferences.checkInTime,
        scheduleId: schedule?.qstashScheduleId,
      });
      scheduled = Boolean(qstashScheduleId);
    } catch (error) {
      console.error("[notifications] could not schedule check-in", error);
    }
    await saveCheckInSchedule({
      userId: id,
      qstashScheduleId: qstashScheduleId ?? schedule?.qstashScheduleId ?? null,
      frequency,
      enabled: scheduled || Boolean(schedule?.qstashScheduleId),
      timezone: preferences.timezone,
      checkInTime: preferences.checkInTime,
    });
  } else {
    try {
      await deleteCheckInSchedule(schedule?.qstashScheduleId);
    } catch (error) {
      console.error("[notifications] could not remove check-in schedule", error);
    }
    await saveCheckInSchedule({
      userId: id,
      qstashScheduleId: null,
      frequency,
      enabled: false,
      timezone: preferences.timezone,
      checkInTime: preferences.checkInTime,
    });
  }
  return Response.json({ preferences, scheduled });
}
