import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteChrome, StillPhoto } from "@/components/site-chrome";
import { useStillStore } from "@/lib/store/still-store";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [{ title: "Still" }],
  }),
});

function HomePage() {
  const onboarded = useStillStore((s) => s.onboarded);
  const enterTo = onboarded ? "/talk" : "/start";
  const enterLabel = onboarded ? "Continue" : "Enter this space";

  return (
    <SiteChrome current="home">
      <section className="mx-auto max-w-5xl px-5 pt-14 pb-8 sm:pt-20 sm:pb-10">
        <p className="rise-in text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
          A companion, not care
        </p>
        <h1 className="font-display rise-in stagger-1 mt-4 max-w-2xl text-4xl font-medium tracking-tight text-fg sm:text-6xl">
          For the hours that feel too heavy to carry alone.
        </h1>
        <p className="rise-in stagger-2 mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
          Still listens without judgment, remembers what you choose to keep, and stays when the night gets long.
        </p>
        <div className="rise-in stagger-3 mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" asChild>
            <Link to={enterTo}>
              {enterLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="quiet" asChild>
            <Link to="/about">About Still</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5">
        <StillPhoto
          src="/images/hero.jpg"
          alt="A quiet room at dusk: an armchair, a lamp, and a window holding the last of the light."
          width={1600}
          height={900}
          className="aspect-video rounded-xl"
          priority
        />
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Presence</p>
            <h2 className="font-display mt-2 text-3xl font-medium tracking-tight">
              Not here to fix you in one sitting.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              Some nights need a person who can sit with the mess. Still is an AI — honest about that —
              tuned for listening, reflecting, and helping you think, not for performance or streaks.
            </p>
          </div>
          <StillPhoto
            src="/images/chair.jpg"
            alt="An empty chair by a night window, a book on the floor, a throw on the seat."
            width={1400}
            height={933}
            className="aspect-[3/2] rounded-xl"
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-6">
        <div className="grid gap-4 md:grid-cols-2">
          <figure>
            <StillPhoto
              src="/images/water.jpg"
              alt="A still lake at dusk, trees on the far shore, the water almost without a ripple."
              width={1400}
              height={933}
              className="aspect-[3/2] rounded-xl"
            />
            <figcaption className="mt-3 text-sm text-muted">
              Memory with purpose — only what you allow, and you can edit or erase it.
            </figcaption>
          </figure>
          <figure>
            <StillPhoto
              src="/images/table.jpg"
              alt="A cup of tea and paper under a small lamp on a dark wooden table."
              width={1400}
              height={933}
              className="aspect-[3/2] rounded-xl"
            />
            <figcaption className="mt-3 text-sm text-muted">
              Optional check-ins. A quiet knock, never a guilt trip.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Inside</p>
        <h2 className="font-display mt-2 text-3xl font-medium tracking-tight">What this space holds</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Feature title="Talk" body="Warm, unhurried conversation. Reflective, not clinical. You can start mid-sentence." />
          <Feature title="Memory" body="Themes, people, what helped. You see it, you change it, you can delete it." />
          <Feature title="A door out" body="If the moment is dangerous, Still stays present and points to a real person." />
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-lg">
            <h2 className="font-display text-3xl font-medium tracking-tight">Whenever you're ready.</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              There's no right way to begin. A sentence, a mess, a silence you can type.
            </p>
          </div>
          <Button size="lg" asChild>
            <Link to={enterTo}>
              {enterLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </SiteChrome>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <h3 className="font-medium text-fg">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
