"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const addMemories = useStillStore((s) => s.addMemories);
  const upsertMemory = useStillStore((s) => s.upsertMemory);
  const deleteMemory = useStillStore((s) => s.deleteMemory);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MemoryKind | "all">("all");
  const [editing, setEditing] = useState<MemoryItem | null>(null);
  const [open, setOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractNote, setExtractNote] = useState<string | null>(null);

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
    const convo = conversations[0];
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
        addMemories(items.map((i) => ({ ...i, source: "still" as const })));
        setExtractNote(`Added ${items.length} ${items.length === 1 ? "note" : "notes"}. Edit anything that feels off.`);
      }
    } finally {
      setExtracting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Memory</p>
          <h1 className="font-display mt-1 text-2xl font-medium tracking-tight sm:text-3xl">What Still keeps</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Only what you allow. Edit or delete anything. This lives on this device until a backend is added.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="quiet" onClick={() => void fromTalk()} disabled={extracting}>
            {extracting ? "Reading…" : "From this talk"}
          </Button>
          <Button onClick={startNew}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </header>

      {extractNote ? <p className="mt-4 text-sm text-muted">{extractNote}</p> : null}

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
