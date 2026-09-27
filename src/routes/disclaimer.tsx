"use client";

import { Link } from "@/lib/nav";
import { LegalLayout, LegalSection } from "@/components/legal-layout";

export function DisclaimerPage() {
  return (
    <LegalLayout
      id="disclaimer"
      kicker="Disclaimer"
      title="Still is not care."
      lede="This page is part of the product, not a footnote. If you need a therapist, a doctor, or emergency help, this is not that door."
    >
      <LegalSection title="Not therapy">
        <p>
          Still is an artificial intelligence companion. It is not a therapist, psychologist,
          psychiatrist, counselor, social worker, or any other licensed clinician. It does not
          diagnose, treat, or manage mental illness. It does not prescribe. It does not replace
          psychiatric or psychological care, or a person who knows you.
        </p>
        <p>
          Nothing Still says is medical advice, psychotherapy, or a crisis intervention. If you
          treat it as those things, you do so against this disclaimer.
        </p>
      </LegalSection>

      <LegalSection title="Illinois and similar laws">
        <p>
          In some places, including Illinois, using AI as therapy is restricted or not allowed.
          Still is designed as a companion — a place to talk — and is labeled that way in the room,
          on About, and here. It is not offered as a therapeutic service.
        </p>
        <p>
          If your place has rules about wellness apps, AI, or health information, those rules still
          apply to you. This page does not give legal advice.
        </p>
      </LegalSection>

      <LegalSection title="Not a crisis service">
        <p>
          Still cannot send someone to you. It cannot call emergency services. It cannot stay on a
          line. If you are in danger of hurting yourself or someone else, or if you are in a medical
          emergency, get a human now: local emergency number, 988 in the US, or a local helpline.
        </p>
        <p>
          The product tries to notice crisis language and then stay present while pointing to real
          help. That path can miss. Do not wait on Still. See{" "}
          <Link to="/safety" className="text-fg underline-offset-4 hover:underline">
            Safety
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="The model can be wrong">
        <p>
          Language models invent, flatten, and miss. They can sound sure when they are not. They can
          miss sarcasm, culture, and pain. They can be unhelpful on a hard night. You are responsible
          for how you use what appears on the screen.
        </p>
      </LegalSection>

      <LegalSection title="No warranty">
        <p>
          To the fullest extent the law allows, Still is provided without warranties of any kind,
          express or implied, including fitness for a particular purpose, merchantability, and
          non-infringement. The people who operate an instance are not responsible for decisions,
          delays in seeking care, or outcomes that follow time spent here.
        </p>
      </LegalSection>

      <LegalSection title="Adults only">
        <p>
          Still is for people 18 and older. It is not a tool for treating a child, and it is not a
          school or pediatric service.
        </p>
      </LegalSection>

      <LegalSection title="If you operate this instance">
        <p>
          If you put Still in front of real people, you need clinical and legal review of the crisis
          path, the disclosure, and these pages before you call it launched. The software as shipped
          is a companion product with a hard-coded safety door — not a certified medical device, and
          not a substitute for that review.
        </p>
        <p>
          <Link to="/terms" className="text-fg underline-offset-4 hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-fg underline-offset-4 hover:underline">
            Privacy
          </Link>{" "}
          sit with this page.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
