import Link from "next/link";
import PageHero from "@/components/page-hero";
import { pageMetadata } from "@/lib/site";
import {
  Item,
  LastUpdated,
  Lead,
  LegalBody,
  List,
  MailLink,
  P,
  Preamble,
  Section,
  SubprocessorTable,
} from "@/components/legal-doc";

export const metadata = pageMetadata({
  path: "/privacy",
  title: "Privacy Policy",
  description:
    "How Bridal Team collects, uses, and shares your information — and how to export or delete your data.",
});

const SUBPROCESSORS = [
  { provider: "Supabase", purpose: "Database, authentication, file storage", data: "Account + planning data" },
  { provider: "Stripe", purpose: "Vendor subscription payments", data: "Billing / contact data" },
  { provider: "Anthropic", purpose: "AI planning features", data: "Prompts + context you submit" },
  { provider: "Resend", purpose: "Transactional email", data: "Email address, message content" },
  { provider: "DigitalOcean", purpose: "Application hosting", data: "Usage / request data" },
  { provider: "Cloudflare", purpose: "CDN, security, DNS", data: "Request metadata, IP address" },
  { provider: "Pexels", purpose: "Inspiration imagery", data: "Image requests" },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" />
      <LegalBody>
        <div className="space-y-4">
          <LastUpdated date="August 24, 2026" />
          <Preamble>
            <P>
              This Privacy Policy explains how <Lead>Bridal Team, LLC</Lead> (&ldquo;Bridal
              Team,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;), a Florida limited liability company,
              collects, uses, and shares information when you use the Bridal Team website and
              applications (the &ldquo;Service&rdquo;). By using the Service you agree to this
              Policy.
            </P>
          </Preamble>
        </div>

        <Section n={1} title="Information we collect">
          <P>
            <Lead>Information you provide:</Lead>
          </P>
          <List>
            <Item>Account details (name, email, password credentials, profile photo).</Item>
            <Item>
              Planning content (weddings, tasks, budgets, timelines, travel details, saved
              inspiration, messages to the AI planner).
            </Item>
            <Item>Vendor details (business name, category, location, gallery, contact info).</Item>
            <Item>Community content (posts, comments, reviews, group memberships).</Item>
            <Item>
              Payment information for vendor subscriptions (processed by Stripe &mdash; we do not
              store full card numbers).
            </Item>
            <Item>Communications you send us (support, waitlist signups).</Item>
          </List>
          <P>
            <Lead>Information collected automatically:</Lead> device and usage data (IP address,
            browser type, pages viewed, actions taken), and cookies or local storage needed to run
            the Service and keep you signed in.
          </P>
          <P>
            <Lead>Information from third parties:</Lead> if you sign in or interact through a
            third-party service, we may receive limited information from it.
          </P>
        </Section>

        <Section n={2} title="How we use information">
          <List>
            <Item>Provide, maintain, and secure the Service and your account.</Item>
            <Item>Generate AI planning assistance from the prompts and context you provide.</Item>
            <Item>Process vendor subscriptions and prevent fraud.</Item>
            <Item>
              Communicate with you (transactional email, and &mdash; only with consent where
              required &mdash; updates).
            </Item>
            <Item>Enforce our Terms and comply with legal obligations.</Item>
            <Item>Improve the Service, using aggregated or de-identified data where feasible.</Item>
          </List>
        </Section>

        <Section n={3} title="Legal bases (where applicable, e.g. EEA/UK)">
          <P>
            We process personal data to perform our contract with you, for our legitimate interests
            (operating and improving the Service, security), to comply with law, and with your
            consent where required.
          </P>
        </Section>

        <Section n={4} title="How we share information">
          <P>
            We do <Lead>not</Lead> sell your personal information. We share it only:
          </P>
          <List>
            <Item>
              With service providers and sub-processors (Section 5) who process it on our behalf.
            </Item>
            <Item>
              With other users when you post or share content publicly (for example, vendor
              profiles, community posts, shared weddings).
            </Item>
            <Item>
              For legal reasons (to comply with law, respond to lawful requests, or protect rights,
              safety, and the Service).
            </Item>
            <Item>In a business transfer (merger, acquisition, or asset sale), subject to this Policy.</Item>
          </List>
        </Section>

        <Section n={5} title="Service providers and sub-processors">
          <P>We use the following processors:</P>
          <SubprocessorTable rows={SUBPROCESSORS} />
        </Section>

        <Section n={6} title="Cookies and similar technologies">
          <P>
            We use cookies and local storage that are necessary to run the Service &mdash; for
            example, to keep you signed in and to remember your session. <Lead>We do not run
            third-party advertising or analytics trackers,</Lead> so there is no consent banner to
            dismiss. You can control cookies through your browser; disabling essential cookies may
            break core features such as signing in.
          </P>
        </Section>

        <Section n={7} title="Data retention">
          <P>
            We keep personal data for as long as your account is active or as needed to provide the
            Service, then delete or de-identify it, except where we must retain it to comply with
            law, resolve disputes, or enforce agreements. Backups are purged on a rolling basis.
          </P>
        </Section>

        <Section n={8} title="Security">
          <P>
            We use administrative, technical, and organizational safeguards &mdash; including access
            controls and database row-level security &mdash; to protect personal data. No method of
            transmission or storage is completely secure, so we cannot guarantee absolute security.
          </P>
        </Section>

        <Section n={9} title="Your rights and choices">
          <P>
            Depending on where you live, you may have rights to access, correct, export, delete, or
            restrict processing of your personal data, and to object or withdraw consent.
          </P>
          <List>
            <Item>
              <Lead>Access and export:</Lead> download a copy of your data from{" "}
              <Link href="/account" className="font-semibold text-brand-text underline-offset-2 hover:underline">
                Account &rarr; Your data
              </Link>
              .
            </Item>
            <Item>
              <Lead>Deletion:</Lead> delete your account from <Lead>Account &rarr; Delete
              account</Lead>. If you co-manage a shared wedding, we remove you without deleting the
              shared plan.
            </Item>
            <Item>
              <Lead>Other requests and appeals:</Lead> contact{" "}
              <MailLink address="info@bridalteam.com" />. We will verify and respond within the time
              required by applicable law.
            </Item>
          </List>
          <P>
            We do not sell or &ldquo;share&rdquo; personal information for cross-context behavioral
            advertising as those terms are defined under applicable state privacy laws, including the
            Florida Digital Bill of Rights and California&rsquo;s CCPA/CPRA.
          </P>
        </Section>

        <Section n={10} title="Children's privacy">
          <P>
            The Service is not directed to children under 18, and we do not knowingly collect
            personal data from them. If you believe a child has provided us data, contact{" "}
            <MailLink address="info@bridalteam.com" /> and we will delete it.
          </P>
        </Section>

        <Section n={11} title="International data transfers">
          <P>
            We are based in the United States, and our database, authentication, and file storage run
            in a United States region (US East). If you access the Service from outside the United
            States, you consent to that processing. Where required, we use appropriate safeguards
            (such as Standard Contractual Clauses) for cross-border transfers.
          </P>
        </Section>

        <Section n={12} title="Changes to this Policy">
          <P>
            We may update this Policy. If changes are material, we will provide notice before they
            take effect and update the &ldquo;Last updated&rdquo; date above.
          </P>
        </Section>

        <Section n={13} title="Contact us">
          <P>Questions or privacy requests:</P>
          <List>
            <Item>
              <Lead>Bridal Team, LLC</Lead>
            </Item>
            <Item>
              Privacy requests: <MailLink address="info@bridalteam.com" />
            </Item>
            <Item>
              General and support: <MailLink address="hello@bridalteam.com" />
            </Item>
          </List>
        </Section>
      </LegalBody>
    </>
  );
}
