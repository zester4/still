"use client";

import { useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/nav";
import { useStillStore } from "@/lib/store/still-store";

export function NotificationsPage() {
  const notifications = useStillStore((s) => s.notifications);
  const setNotifications = useStillStore((s) => s.setNotifications);
  const markNotificationsRead = useStillStore((s) => s.markNotificationsRead);

  useEffect(() => {
    void fetch("/api/notifications")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { notifications?: typeof notifications } | null) => {
        if (data?.notifications) setNotifications(data.notifications);
      })
      .catch(() => undefined);
  }, [setNotifications]);

  async function markAllRead() {
    markNotificationsRead();
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => undefined);
  }

  return (
    <div className="app-page mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:py-8">
      <BackLink fallback="/you" className="mb-3" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Notifications</p>
          <h1 className="font-display mt-1 text-2xl font-medium tracking-tight sm:text-3xl">A gentle nudge.</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Reminders and small things waiting for you. Nothing here is urgent.
          </p>
        </div>
        {notifications.some((item) => !item.readAt) ? (
          <Button variant="quiet" size="sm" onClick={() => void markAllRead()}>
            <Check className="size-4" />
            Mark all read
          </Button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-16 rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
          <Bell className="size-5 text-muted" strokeWidth={1.6} />
          <p className="font-display mt-4 text-2xl font-medium tracking-tight">Nothing waiting.</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Turn on check-ins when you want Still to knock softly once in a while.
          </p>
          <Button className="mt-4" variant="quiet" asChild>
            <Link to="/check-ins">Check-in settings</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-2">
          {notifications.map((item) => (
            <li key={item.id}>
              <Link
                to={item.href}
                onClick={() => {
                  if (!item.readAt) {
                    markNotificationsRead([item.id]);
                    void fetch("/api/notifications", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ids: [item.id] }),
                    });
                  }
                }}
                className={`block rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] transition-colors hover:bg-surface-2 ${
                  item.readAt ? "opacity-70" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-fg">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
                  </div>
                  {!item.readAt ? <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" /> : null}
                </div>
                <p className="mt-3 text-[11px] text-subtle">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
