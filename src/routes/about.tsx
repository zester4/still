import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CrisisCard } from "@/components/crisis-card";
import { SiteChrome, StillPhoto } from "@/components/site-chrome";
import { useStillStore } from "@/lib/store/still-store";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [{ title: "About · Still" }],
  }),
});

function AboutPage() {
  const onboarded = useStillStore((s) => s.onboarded);
  const enterTo = onboarded ? "/talk" : "/start";

  return (
    <SiteChrome current="about">
      <article className="mx-auto max-w-5xl px-5 py-8 sm:py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">About</p>
        <h1 className="font-display mt-3 max-w-2xl text-3xl font-medium leading-tight tracking-tight sm:text-5xl">
          Still is an AI companion. It will not pretend to be more.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:mt-5 sm:text-lg">
          Built for adults sitting with depression, low mood, loneliness, or overwhelm who want a
          place to talk that is not an intake form, and not a friend they are afraid of burdening.
        </p>

        <StillPhoto
          src="/images/table.jpg"
          alt="Tea, paper, and a small lamp on a dark table."
          width={1400}
          height={933}
          className="mt-10 aspect-[16/8] rounded-xl object-cover"
        />

        <div className="mt-12 grid gap-12 md:grid-cols-2">
          <section>
            <h2 className="font-display text-2xl font-medium tracking-tight">What it is</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
              <li>A listener. Presence over performance.</li>
              <li>Memory you control — themes, people, what helped, goals you set.</li>
              <li>Optional check-ins. Never stacked. Never guilt-based.</li>
              <li>A safety net that only appears when it is actually needed.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-display text-2xl font-medium tracking-tight">What it is not</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
              <li>Not a therapist, clinician, or crisis service.</li>
              <li>Not a diagnosis, and not medication guidance.</li>
              <li>Not a replacement for a person who knows you.</li>
              <li>Not optimized to keep you in the app.</li>
            </ul>
          </section>
        </div>

        <div className="mt-14 grid items-center gap-10 md:grid-cols-2">
          <StillPhoto
            src="/images/chair.jpg"
            alt="A chair left by the window at night."
            width={1400}
            height={933}
            className="aspect-[3/2] rounded-xl"
          />
          <div>
            <h2 className="font-display text-2xl font-medium tracking-tight">Honesty, on purpose</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
              <p>
                In some places — including Illinois — using AI as therapy is restricted or banned.
                Still is designed as a companion, and it says so in the room, not in the fine print.
              </p>
              <p>
                Talks and memory live on this device for now. You can export or erase everything from
                You. A later backend can sync; until then, this space is yours locally.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-medium tracking-tight">If you need a person</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Always available. You do not have to wait until it feels like an emergency. If you are in
            immediate danger, reach a human first.
          </p>
          <div className="max-w-xl">
            <CrisisCard />
          </div>
        </section>

        <StillPhoto
          src="/images/water.jpg"
          alt="Still water at dusk, a dark treeline on the far shore."
          width={1400}
          height={933}
          className="mt-16 aspect-[16/7] rounded-xl object-cover"
        />

        <section className="mt-16 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-medium tracking-tight">Whenever you're ready.</h2>
            <p className="mt-2 text-sm text-muted">No right way to start.</p>
          </div>
          <Button size="lg" asChild>
            <Link to={enterTo}>
              {onboarded ? "Continue" : "Enter this space"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </article>
    </SiteChrome>
  );
}
