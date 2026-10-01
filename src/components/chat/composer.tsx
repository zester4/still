"use client";

import { type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Composer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Write whatever's here.",
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!value.trim() || disabled) return;
    onSend();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-2xl px-3 pb-2 pt-1.5 sm:px-4 sm:pb-3 sm:pt-2"
    >
      <div
        className={cn(
          "flex items-end gap-2 rounded-xl bg-surface p-2 pl-3.5 shadow-[var(--shadow-border)]",
          "focus-within:shadow-[var(--shadow-border-hover)]",
        )}
      >
        <textarea
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 2000))}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Message"
          className="h-11 min-h-11 flex-1 resize-none overflow-y-auto bg-transparent py-2.5 text-[0.95rem] leading-relaxed text-fg placeholder:text-subtle focus-visible:outline-none disabled:opacity-60"
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !value.trim()}
          aria-label="Send"
          className="shrink-0"
        >
          <ArrowUp className="size-4" strokeWidth={2.2} />
        </Button>
      </div>
      <p className="mt-2 px-1 text-center text-[11px] leading-relaxed text-subtle">
        Still is an AI companion, not a therapist or a crisis service.
      </p>
    </form>
  );
}
