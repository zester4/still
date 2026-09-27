"use client";

import { Link } from "@/lib/nav";
import { CrisisCard } from "@/components/crisis-card";
import { LegalLayout, LegalSection } from "@/components/legal-layout";

export function SafetyPage() {
  return (
    <LegalLayout
      id="safety"
      kicker="Safety"
      title="If the night is dangerous, reach a person."
      lede="Still can stay in the room. It cannot come to you. This page is the door we keep in the open, not only when the model notices."
    >
      <LegalSection title="Right now">
        <p>
          If you are in immediate danger, call your local emergency number. In the United States,
          call or text 988. If you can, ask someone in the room with you to stay.
        </p>
        <CrisisCard />
      </LegalSection>

      <LegalSection title="What Still does">
        <p>
          If what you type looks like a crisis — wanting to be dead, a plan, or a way to be gone —
          Still does not generate a free-form reply from the model. It stays in a short, present
          voice and shows human resources. That path is written ahead of time on purpose.
        </p>
        <p>
          The same door lives in Quiet, on About, and in You. You do not have to wait until the
          product “notices.” You can open it whenever you want.
        </p>
      </LegalSection>

      <LegalSection title="What Still cannot do">
        <ul className="list-disc space-y-1 pl-5">
          <li>It cannot dispatch police, an ambulance, or a mobile crisis team.</li>
          <li>It cannot keep a phone line open.</li>
          <li>It cannot tell a friend or a clinician unless you do.</li>
          <li>It can miss the moment. Language is messy. Detectors fail.</li>
        </ul>
        <p>If you are unsure whether it is “bad enough,” it is already enough to reach a person.</p>
      </LegalSection>

      <LegalSection title="Letters and memory">
        <p>
          Unsent letters are for you. If a letter reads like a crisis, the product will still show
          the human door. Memory is only what you allow. You can delete it.
        </p>
      </LegalSection>

      <LegalSection title="This is not monitoring">
        <p>
          Still is not a suicide-watch service and not a clinical safety plan. No one is sitting
          behind a dashboard of your night. If you need to be watched by a person, that has to be
          arranged in the real world.
        </p>
        <p>
          Read the{" "}
          <Link to="/disclaimer" className="text-fg underline-offset-4 hover:underline">
            Disclaimer
          </Link>{" "}
          with this page. They are meant to be read together.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
