"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MEMORY_KIND_LABEL, type MemoryItem, type MemoryKind } from "@/lib/companion/types";
import { useStillStore } from "@/lib/store/still-store";
import { nowIso, uid } from "@/lib/utils";
import { requestMemoryExtract } from "@/lib/companion/send";
import { formatDistanceToNow } from "date-fns";

const KINDS: MemoryKind[] = ["theme", "person", "situation", "coping", "goal"];

export function MemoryPage() {
  const memories = useStillStore((s) => s.memories);
  const conversations = useStillStore((s) => s.conversations);
  const activeConversationId = useStillStore((s) => s.activeConversationId);
  const addMemories = useStillStore((s) => s.addMemories);
  const upsertMemory = useStillStore((s) => s.upsertMemory);
  const deleteMemory = useStillStore((s) => s.deleteMemory);
  const memoryEnabled = useStillStore((s) => s.preferences.memoryEnabled);
  const setPreferences = useStillStore((s) => s.setPreferences);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MemoryKind | "all">("all");
  const [editing, setEditing] = useState<MemoryItem | null>(null);
  const [open, setOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractNote, setExtractNote] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ kind: MemoryKind; title: string; detail: string }>>([]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return memories.filter((m) => {
      if (filter !== "all" && m.kind !== filter) return false;
      if (!q) return true;
      return `${m.title} ${m.detail}`.toLowerCase().includes(q);
    });
  }, [memories, query, filter]);

  function startNew() {
    setEditing({
      id: uid(),
      kind: "theme",
      title: "",
      detail: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      source: "you",
    });
    setOpen(true);
  }

  async function fromTalk() {
    if (!memoryEnabled) {
      setExtractNote("Memory is off. Turn it on when you want Still to remember something.");
      return;
    }
    const convo = conversations.find((item) => item.id === activeConversationId) ?? conversations[0];
    if (!convo || convo.messages.length < 2) {
      setExtractNote("Have a little more of a talk first — then Still can offer notes.");
      return;
    }
    setExtracting(true);
    setExtractNote(null);
    try {
      const items = await requestMemoryExtract({
        history: convo.messages.map((m) => ({ role: m.role, content: m.content })),
        existing: memories,
      });
      if (!items.length) {
        setExtractNote("Nothing new to keep. You can add something yourself.");
      } else {
        setSuggestions(items);
        setExtractNote("Still found a few possible memories. Choose what deserves to stay.");
      }
    } finally {
      setExtracting(false);
    }
  }

  return (
    <div className="app-page mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:py-8">
      <BackLink fallback="/talk" className="mb-3" />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Memory</p>
          <h1 className="font-display mt-1 text-2xl font-medium tracking-tight sm:text-3xl">What Still keeps</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Only what you allow. Edit or delete anything. It is kept with your account.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-1.5 sm:w-auto sm:gap-2">
          <Button size="sm" variant="quiet" onClick={() => void fromTalk()} disabled={extracting}>
            {extracting ? "Reading…" : "From this talk"}
          </Button>
          <Button size="sm" onClick={startNew}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </header>

      <section className="mt-6 flex items-center justify-between gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div>
          <p className="text-sm font-medium">Let Still use memory</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">
            When this is off, existing memories stay here but are not used to shape replies.
          </p>
        </div>
        <Switch
          checked={memoryEnabled}
          onCheckedChange={(enabled) => {
            setPreferences({ memoryEnabled: enabled });
            void fetch("/api/preferences", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ memoryEnabled: enabled }),
            });
          }}
        />
      </section>

      {extractNote ? <p className="mt-4 text-sm text-muted">{extractNote}</p> : null}

      {suggestions.length ? (
        <section className="mt-4 rounded-xl bg-surface-2 p-4 shadow-[var(--shadow-border)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Suggested memories</p>
              <p className="mt-1 text-sm text-fg">Keep only what feels true and useful.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSuggestions([]);
                setExtractNote("Those suggestions were let go.");
              }}
            >
              Dismiss
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {suggestions.map((item, index) => (
              <li key={`${item.title}-${index}`} className="rounded-lg bg-surface px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{MEMORY_KIND_LABEL[item.kind]}</p>
                <p className="mt-1 text-sm font-medium text-fg">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.detail}</p>
              </li>
            ))}
          </ul>
          <Button
            className="mt-3"
            onClick={() => {
              addMemories(suggestions.map((item) => ({ ...item, source: "still" as const })));
              setSuggestions([]);
              setExtractNote("Kept. You can edit or forget these at any time.");
            }}
          >
            Keep these memories
          </Button>
        </section>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search memory"
          aria-label="Search memory"
        />
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {KINDS.map((k) => (
            <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)}>
              {MEMORY_KIND_LABEL[k]}
            </FilterChip>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-16">
          <p className="font-display text-2xl font-medium tracking-tight">Nothing stored yet.</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Recurring themes, people, what helped, goals you set for yourself. Still will only keep what you can see here.
          </p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {visible.map((m) => (
            <li
              key={m.id}
              className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                    {MEMORY_KIND_LABEL[m.kind]}
                    <span className="text-subtle"> · {m.source === "you" ? "You" : "Still"}</span>
                  </p>
                  <h2 className="mt-1 font-medium text-fg">{m.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{m.detail}</p>
                  <p className="mt-3 text-[11px] text-subtle">
                    Updated {formatDistanceToNow(new Date(m.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit"
                    className="size-10"
                    onClick={() => {
                      setEditing(m);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    className="size-10"
                    onClick={() => deleteMemory(m.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MemoryEditor
        open={open}
        item={editing}
        onOpenChange={setOpen}
        onSave={(item) => {
          upsertMemory(item);
          setOpen(false);
        }}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "h-9 rounded-full bg-accent px-3 text-xs font-medium text-accent-fg"
          : "h-9 rounded-full bg-surface-2 px-3 text-xs text-muted shadow-[var(--shadow-border)]"
      }
    >
      {children}
    </button>
  );
}

function MemoryEditor({
  open,
  item,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  item: MemoryItem | null;
  onOpenChange: (v: boolean) => void;
  onSave: (item: MemoryItem) => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [detail, setDetail] = useState(item?.detail ?? "");
  const [kind, setKind] = useState<MemoryKind>(item?.kind ?? "theme");

  const ready = open && item;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        onOpenAutoFocus={() => {
          setTitle(item?.title ?? "");
          setDetail(item?.detail ?? "");
          setKind(item?.kind ?? "theme");
        }}
      >
        <DialogHeader>
          <DialogTitle>{item?.title ? "Edit memory" : "Add memory"}</DialogTitle>
          <DialogDescription>Kept only with your say-so. Short is better.</DialogDescription>
        </DialogHeader>
        {ready ? (
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              onSave({
                ...item,
                title: title.trim(),
                detail: detail.trim(),
                kind,
                source: item.source,
              });
            }}
          >
            <div className="flex flex-wrap gap-1.5">
              {KINDS.map((k) => (
                <FilterChip key={k} active={kind === k} onClick={() => setKind(k)}>
                  {MEMORY_KIND_LABEL[k]}
                </FilterChip>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mem-title">Title</Label>
              <Input
                id="mem-title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mem-detail">Detail</Label>
              <Textarea
                id="mem-detail"
                value={detail}
                onChange={(e) => setDetail(e.target.value.slice(0, 400))}
              />
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
