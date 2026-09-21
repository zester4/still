"use client";

import { Link } from "@/lib/nav";
import { useMemo, useRef, useState } from "react";
import { Thread } from "@/components/chat/thread";
import { Composer } from "@/components/chat/composer";
import { CheckInPrompt } from "@/components/chat/check-in-prompt";
import { PulseBar } from "@/components/chat/pulse-bar";
import { Button } from "@/components/ui/button";
import { requestMemoryExtract, sendToCompanion } from "@/lib/companion/send";
import type { Intent } from "@/lib/companion/types";
import { uid } from "@/lib/utils";
import {
  checkInIsDue,
  useStillStore,
  userMessageCount,
} from "@/lib/store/still-store";

export function TalkPage() {
  const conversations = useStillStore((s) => s.conversations);
  const activeId = useStillStore((s) => s.activeConversationId);
  const memories = useStillStore((s) => s.memories);
  const ensureConversation = useStillStore((s) => s.ensureConversation);
  const addMessage = useStillStore((s) => s.addMessage);
  const updateMessage = useStillStore((s) => s.updateMessage);
  const appendToMessage = useStillStore((s) => s.appendToMessage);
  const startNewPage = useStillStore((s) => s.startNewPage);
  const snoozeCheckIn = useStillStore((s) => s.snoozeCheckIn);
  const answerCheckIn = useStillStore((s) => s.answerCheckIn);
  const addMemories = useStillStore((s) => s.addMemories);
  const addPulse = useStillStore((s) => s.addPulse);
  const markPulseAsked = useStillStore((s) => s.markPulseAsked);

  const convo = conversations.find((c) => c.id === activeId);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(() => checkInIsDue(useStillStore.getState()));
  const [pulseOpen, setPulseOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const sending = useRef(false);

  const continuity = useMemo(() => {
    const prior = conversations.filter((c) => c.id !== convo?.id && c.messages.some((m) => m.role === "user"));
    if (prior.length === 0) return null;
    return memories[0]?.title ?? null;
  }, [conversations, convo, memories]);

  async function onSend() {
    const text = draft.trim();
    if (!text || sending.current) return;
    sending.current = true;
    setDraft("");
    setNotice(null);

    const conversationId = ensureConversation();
    const userId = addMessage(conversationId, { role: "user", content: text });
    setListening(true);

    const latest = useStillStore.getState();
    const current = latest.conversations.find((c) => c.id === conversationId);
    const history = (current?.messages ?? [])
      .filter((m) => m.id !== userId)
      .map((m) => ({ role: m.role, content: m.content }));

    let companionId: string | null = null;
    let gotCrisis = false;
    let intent: Intent | undefined;

    const ensureCompanion = () => {
      if (companionId) return companionId;
      companionId = uid();
      addMessage(conversationId, {
        id: companionId,
        role: "companion",
        content: "",
      });
      return companionId;
    };

    try {
      await sendToCompanion(
        {
          message: text,
          name: latest.name,
          concerns: latest.concerns,
          memories: latest.memories,
          history,
        },
        (ev) => {
          if (ev.type === "intent") {
            intent = ev.intent;
            updateMessage(conversationId, userId, { intent: ev.intent });
          }
          if (ev.type === "delta") {
            setListening(false);
            const id = ensureCompanion();
            appendToMessage(conversationId, id, ev.text);
            if (intent) updateMessage(conversationId, id, { intent });
          }
          if (ev.type === "crisis") {
            gotCrisis = true;
            setListening(false);
            const id = ensureCompanion();
            updateMessage(conversationId, id, {
              content: ev.text,
              crisis: true,
              intent: "escalating-risk",
            });
          }
          if (ev.type === "replace") {
            gotCrisis = Boolean(ev.crisis);
            setListening(false);
            const id = ensureCompanion();
            updateMessage(conversationId, id, {
              content: ev.text,
              crisis: ev.crisis,
              intent: ev.intent ?? intent,
            });
          }
          if (ev.type === "error") {
            setListening(false);
            const id = ensureCompanion();
            updateMessage(conversationId, id, {
              content:
                "I lost the thread for a moment. Send that again when you're ready — I'm still here.",
            });
          }
        },
      );
    } finally {
      setListening(false);
      sending.current = false;
    }

    if (!companionId) {
      addMessage(conversationId, {
        role: "companion",
        content: "I'm still here. Try sending that again in a moment.",
      });
    }

    const after = useStillStore.getState();
    const afterConvo = after.conversations.find((c) => c.id === conversationId);
    const users = userMessageCount(afterConvo);
    if (!gotCrisis && afterConvo && users >= 4 && !afterConvo.pulseAsked) {
      setPulseOpen(true);
    }
    if (!gotCrisis && afterConvo && users > 0 && users % 6 === 0) {
      const items = await requestMemoryExtract({
        history: afterConvo.messages.map((m) => ({ role: m.role, content: m.content })),
        existing: after.memories,
      });
      if (items.length) {
        addMemories(items.map((i) => ({ ...i, source: "still" as const })));
        setNotice("Still noted a few things. You can edit them in Memory.");
      }
    }
  }

  const messages = convo?.messages ?? [];
  const empty = messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
        <div className="min-w-0">
          <p className="text-sm text-fg">Here with you</p>
          {continuity ? (
            <p className="truncate text-xs text-muted">Last time you mentioned {continuity}</p>
          ) : (
            <p className="text-xs text-muted">Whenever you're ready</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/pages">Pages</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              startNewPage();
              setPulseOpen(false);
              setNotice(null);
            }}
          >
            New page
          </Button>
        </div>
      </div>

      {checkInOpen ? (
        <CheckInPrompt
          onLater={() => {
            snoozeCheckIn();
            setCheckInOpen(false);
          }}
          onAnswer={(mood, note) => {
            answerCheckIn(mood, note);
            setCheckInOpen(false);
            const id = ensureConversation();
            addMessage(id, {
              role: "companion",
              content:
                mood === "heavy"
                  ? "Thank you for saying so. Heavy can sit here without being solved first. What's making it weighty today?"
                  : mood === "lighter"
                    ? "Good to hear there's a little more room. What helped, even a little?"
                    : "Thanks for checking in. I'm here either way. What's present?",
              intent: "check-in",
            });
          }}
        />
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {empty && !listening ? (
          <div className="mx-auto flex max-w-lg flex-col items-start px-6 py-16">
            <p className="font-display text-2xl font-medium tracking-tight text-fg sm:text-3xl">
              Whenever you're ready.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              There's no right way to start. A sentence, a mess, a silence you can type.
            </p>
          </div>
        ) : (
          <Thread messages={messages} listening={listening} />
        )}
      </div>

      {notice ? (
        <p className="px-4 pb-1 text-center text-xs text-muted">{notice}</p>
      ) : null}

      {pulseOpen ? (
        <PulseBar
          onSkip={() => {
            if (convo) markPulseAsked(convo.id);
            setPulseOpen(false);
          }}
          onChoose={(v) => {
            if (convo) addPulse(convo.id, v);
            setPulseOpen(false);
          }}
        />
      ) : null}

      <Composer
        value={draft}
        onChange={setDraft}
        onSend={() => void onSend()}
        disabled={listening}
      />
    </div>
  );
}
