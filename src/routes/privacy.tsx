"use client";

import { Link } from "@/lib/nav";
import { LegalLayout, LegalSection } from "@/components/legal-layout";

export function PrivacyPage() {
  return (
    <LegalLayout
      id="privacy"
      kicker="Privacy"
      title="What we keep, and what you can take away."
      lede="Still holds words people often would not put in a feed. This page says what is stored, why, who can see it, and how you erase it."
    >
      <LegalSection title="1. Who this is for">
        <p>
          This policy is for people who use this Still instance: visitors to the public pages, and
          people who make an account. Still is for adults. We do not knowingly collect personal
          information from anyone under 18. If you believe a child made an account, erase it from You
          or stop using the instance and tell the operator.
        </p>
      </LegalSection>

      <LegalSection title="2. What we collect">
        <p>When you make an account:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Email, a password stored as a hash (not the password itself), and an optional name.</li>
          <li>The time the account was created.</li>
        </ul>
        <p>When you use the companion:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Talks (messages you send, and replies).</li>
          <li>Memory you allow (themes, people, situations, what helped, goals).</li>
          <li>Letters you write and do not have to send.</li>
          <li>Optional check-ins, moods, and “did you feel understood” answers.</li>
          <li>Onboarding choices, such as concerns you named.</li>
        </ul>
        <p>
          The product also keeps a copy of that companion data in this browser (local storage) so the
          space feels immediate. Signing in loads the account copy from the server when a database is
          configured.
        </p>
        <p>
          We do not ask for payment details, precise location, contacts, photos from your camera roll,
          or health-record connections.
        </p>
      </LegalSection>

      <LegalSection title="3. Why">
        <p>We use this information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Run your account and keep you signed in.</li>
          <li>Generate a reply, and remember only what you have allowed the product to keep.</li>
          <li>Show check-ins you opted into, and patterns you can look at.</li>
          <li>Detect language that looks like a crisis, so the hard-coded safety path can run.</li>
          <li>Let you export or erase.</li>
        </ul>
        <p>We do not sell your talks. We do not use them to advertise to you.</p>
      </LegalSection>

      <LegalSection title="4. Who else can see words">
        <p>
          <strong className="font-medium text-fg">The language model.</strong> When OpenRouter is
          configured, the current talk (and a little memory for continuity) is sent to OpenRouter so a
          model can reply. OpenRouter and the model provider then process that text under their own
          terms. Crisis language is not supposed to be answered by the model; it follows a fixed path
          instead. If OpenRouter is not configured, an on-device listener replies and that text does
          not leave the instance for generation.
        </p>
        <p>
          <strong className="font-medium text-fg">The database.</strong> When a database URL is set,
          account and companion data are stored in Postgres (Neon in production). The operator of the
          instance, and the database host, can technically access rows. Queries are written to load
          only the signed-in person’s data.
        </p>
        <p>
          <strong className="font-medium text-fg">Hosting.</strong> The app is served by whatever host
          the operator chose. Hosts see ordinary technical logs (IP address, time, pages requested).
        </p>
        <p>
          We do not sell personal information. We do not share talks with advertisers. We may share
          information if the law requires it, or to protect someone from immediate harm.
        </p>
      </LegalSection>

      <LegalSection title="5. Cookies and this device">
        <p>
          Signing in uses a session cookie (or similar) so the server knows it is you. That cookie is
          necessary for the account. We do not use advertising cookies or third-party trackers in the
          product as shipped.
        </p>
        <p>
          Companion data is also cached in local storage on this device. Clearing site data in the
          browser removes that copy. It does not, by itself, erase the account copy on the server.
          Use Erase in You for that.
        </p>
      </LegalSection>

      <LegalSection title="6. How long">
        <p>
          Account and companion data stay until you erase them, or until the operator deletes the
          instance. Session cookies last about thirty days of inactivity, unless you sign out sooner.
        </p>
        <p>
          This is not a medical record. There is no hospital retention schedule. If you need something
          gone, export if you want a copy, then erase.
        </p>
      </LegalSection>

      <LegalSection title="7. Your choices">
        <ul className="list-disc space-y-1 pl-5">
          <li>Edit or delete memory items one by one.</li>
          <li>Export a JSON copy from You.</li>
          <li>Erase your account and companion data from You (server copy and this device).</li>
          <li>Sign out.</li>
          <li>Stop using Still.</li>
        </ul>
        <p>
          Depending on where you live (for example the EEA, UK, or some US states), you may have
          rights to access, correct, delete, or export personal data, or to object to certain
          processing. Use the tools in You first. If this instance has an operator contact, use that
          for a request we cannot fulfill in the product.
        </p>
      </LegalSection>

      <LegalSection title="8. Security">
        <p>
          Passwords are hashed. Sessions use signed tokens. Transport should be HTTPS on a deployed
          host. No method of storage is perfect. Do not put in Still anything you could not bear
          someone reading if a host, a model provider, or a stolen laptop were involved.
        </p>
        <p>
          Sensitive mental-health text is not encrypted separately from the rest of the database in
          this version. Treat that as a current limit, not a promise.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes">
        <p>
          This policy can change. The date at the top will move. Material changes should be obvious
          here. Continued use after a change means you accept the new policy.
        </p>
        <p>
          Related:{" "}
          <Link to="/terms" className="text-fg underline-offset-4 hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/disclaimer" className="text-fg underline-offset-4 hover:underline">
            Disclaimer
          </Link>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
