"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/companion/types";
import { cn } from "@/lib/utils";
import { CrisisCard } from "@/components/crisis-card";

export function Thread({
  messages,
  listening,
}: {
  messages: ChatMessage[];
  listening: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastContentLength = messages[messages.length - 1]?.content.length ?? 0;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: listening ? "auto" : "smooth", block: "end" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages.length, listening, lastContentLength]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4 [overflow-anchor:none] sm:gap-6 sm:py-8">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {listening ? <ListeningRow /> : null}
      <div ref={endRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[min(100%,34rem)] rounded-[18px] rounded-br-sm bg-surface-2 px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-fg shadow-[var(--shadow-border)] sm:px-4 sm:py-3 sm:text-[0.9rem]">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[min(100%,38rem)]">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">Still</p>
        <div
          className={cn(
            "font-display text-[0.9rem] leading-[1.55] text-fg sm:text-[1rem]",
            message.crisis && "text-fg",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content || " "}</p>
        </div>
        {message.crisis ? <CrisisCard /> : null}
      </div>
    </div>
  );
}

function ListeningRow() {
  return (
    <div className="flex justify-start">
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
          Still is listening
        </p>
        <div className="flex items-center gap-1.5 py-1" aria-label="Listening">
          <span className="listening-dash" />
          <span className="listening-dash" />
          <span className="listening-dash" />
        </div>
      </div>
    </div>
  );
}
