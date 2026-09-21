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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, listening, messages[messages.length - 1]?.content]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:gap-7 sm:py-8">
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
        <div className="max-w-[min(100%,34rem)] rounded-[18px] rounded-br-sm bg-surface-2 px-4 py-3 text-[0.9375rem] leading-relaxed text-fg shadow-[var(--shadow-border)]">
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
            "font-display text-[1.05rem] leading-[1.55] text-fg",
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
