"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CrisisCard } from "@/components/crisis-card";
import { detectCrisis } from "@/lib/companion/safety";
import type { Letter } from "@/lib/companion/types";
import { useStillStore } from "@/lib/store/still-store";
import { nowIso, uid } from "@/lib/utils";

export function LettersPage() {
  const letters = useStillStore((s) => s.letters ?? []);
  const upsertLetter = useStillStore((s) => s.upsertLetter);
  const deleteLetter = useStillStore((s) => s.deleteLetter);
  const [editing, setEditing] = useState<Letter | null>(null);

  function startNew() {
    setEditing({
      id: uid(),
      to: "",
      body: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }

  function save() {
    if (!editing) return;
    if (!editing.body.trim() && !editing.to.trim()) {
      setEditing(null);
      return;
    }
    upsertLetter({
      ...editing,
      to: editing.to.trim().slice(0, 80),
      body: editing.body.slice(0, 8000),
    });
    setEditing(null);
  }

  if (editing) {
    return (
      <LetterEditor
        letter={editing}
        onChange={setEditing}
        onSave={save}
        onCancel={() => setEditing(null)}
        onDelete={() => {
          deleteLetter(editing.id);
          setEditing(null);
        }}
        isNew={!letters.some((l) => l.id === editing.id)}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:py-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Letters</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">You don't have to send it.</h1>
        <Button size="sm" variant="quiet" onClick={startNew}>
          Write
        </Button>
      </div>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        To someone, or to yourself. It stays on this device. Still will not answer it.
      </p>

      {letters.length === 0 ? (
        <p className="mt-10 text-sm leading-relaxed text-muted">
          Nothing here yet. A few sentences is enough. You can leave it unfinished.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-2">
          {letters.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => setEditing(l)}
                className="w-full rounded-xl bg-surface px-4 py-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-fg">{l.to ? `To ${l.to}` : "Unaddressed"}</p>
                  <p className="text-[11px] text-subtle">{format(new Date(l.updatedAt), "MMM d")}</p>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                  {l.body.trim() || "Unfinished."}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LetterEditor({
  letter,
  onChange,
  onSave,
  onCancel,
  onDelete,
  isNew,
}: {
  letter: Letter;
  onChange: (l: Letter) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  isNew: boolean;
}) {
  const heavy = useMemo(() => detectCrisis(`${letter.to} ${letter.body}`), [letter.to, letter.body]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:py-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">A letter</p>
      <h1 className="font-display mt-1 text-2xl font-medium tracking-tight sm:text-3xl">Write, and leave it here.</h1>

      <div className="mt-8 space-y-4">
        <div>
          <Label htmlFor="letter-to">To — optional</Label>
          <Input
            id="letter-to"
            className="mt-2"
            value={letter.to}
            onChange={(e) => onChange({ ...letter, to: e.target.value.slice(0, 80) })}
            placeholder="Someone, or yourself"
          />
        </div>
        <div>
          <Label htmlFor="letter-body">The letter</Label>
          <Textarea
            id="letter-body"
            className="mt-2 min-h-56"
            value={letter.body}
            onChange={(e) => onChange({ ...letter, body: e.target.value.slice(0, 8000) })}
            placeholder="There's no right way to start."
          />
        </div>
      </div>

      {heavy ? (
        <div className="mt-6">
          <p className="text-sm leading-relaxed text-muted">
            If this is a dangerous moment, a person is the right door. The letter can wait.
          </p>
          <CrisisCard />
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
        <Button onClick={onSave}>Keep this</Button>
        <Button variant="ghost" onClick={onCancel}>
          Back
        </Button>
        {!isNew ? (
          <Button variant="outline" onClick={onDelete}>
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}
