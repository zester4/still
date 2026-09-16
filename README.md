# Still

A quiet AI companion for hard nights and ordinary days.

Still is **not a therapist**, not a clinician, and not a crisis service. It listens, remembers what you ask it to keep, and helps you think something through — without pretending to be care.

In some places, including Illinois, using AI as therapy is restricted. This app is designed as a companion, and it says so plainly.

## What’s here

- **Home / About** — a public landing, and an honest account of what this is
- **Talk** — a warm, unhurried conversation
- **Pages** — past talks, kept as they were
- **Memory** — themes, people, what helped, goals you set — view, edit, or delete
- **Quiet** — optional sitting, noticing the room, or a hard-night door
- **Letters** — write something you don’t have to send
- **Patterns** — how the weeks have felt, not a score
- **Check-ins** — optional, never guilt-based
- **You** — disclosure, data export/erase, human resources
- **Safety** — crisis language takes a hard-coded path (presence + real helplines), not a free-generated reply

Data lives on this device (`localStorage`) until a backend is added.

## Stack

TanStack Start, React 19, Vite, Tailwind v4.

## Run

```bash
npm install
npm run dev
```

The companion talks through **OpenRouter** when `OPENROUTER_API_KEY` is set on the server (see `.env.example`). You can choose a model with `OPENROUTER_MODEL`. If the model is unreachable, Still stays present with an on-device listener. Crisis handling never depends on the model.

If this is a hard moment, reach a person:

- [IASP local helplines](https://www.iasp.info/suicidalthoughts/)
- US: call or text **988**
- Crisis Text Line: text **HOME** to **741741**
