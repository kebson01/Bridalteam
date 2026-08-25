import Link from "next/link";
import PageHero from "@/components/page-hero";
import { pageMetadata } from "@/lib/site";
import {
  Allcaps,
  Callout,
  Item,
  LastUpdated,
  Lead,
  LegalBody,
  List,
  MailLink,
  P,
  Preamble,
  Section,
} from "@/components/legal-doc";

export const metadata = pageMetadata({
  path: "/terms",
  title: "Terms of Service",
  description:
    "The terms for using Bridal Team, including vendor subscription billing and automatic renewal.",
});

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of Service" />
      <LegalBody>
        <div className="space-y-4">
          <LastUpdated date="August 24, 2026" />
          <Preamble>
            <P>
              These Terms of Service (&ldquo;Terms&rdquo;) are a binding agreement between you and{" "}
              <Lead>Bridal Team, LLC</Lead> (&ldquo;Bridal Team,&rdquo; &ldquo;we,&rdquo;
              &ldquo;us,&rdquo; or &ldquo;our&rdquo;), a Florida limited liability company, which
              operates the Bridal Team website and applications (the &ldquo;Service&rdquo;). By
              creating an account, accessing, or using the Service, you agree to these Terms and to
              our{" "}
              <Link href="/privacy" className="font-semibold text-brand-text underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              . If you do not agree, do not use the Service.
            </P>
          </Preamble>
        </div>

        <Section n={1} title="Who may use the Service">
          <P>
            You must be at least 18 years old and able to form a binding contract. If you use the
            Service on behalf of a business (for example, as a wedding vendor), you represent that
            you are authorized to bind that business to these Terms.
          </P>
        </Section>

        <Section n={2} title="Your account">
          <P>
            You are responsible for the accuracy of the information you provide, for safeguarding
            your credentials, and for all activity under your account. Notify us promptly at{" "}
            <MailLink address="info@bridalteam.com" /> if you suspect unauthorized use. You can
            delete your account at any time from <Lead>Account &rarr; Delete account</Lead>; see
            Section 11.
          </P>
        </Section>

        <Section n={3} title="The Service">
          <P>Bridal Team helps couples plan weddings and helps vendors get discovered.</P>
          <List>
            <Item>
              <Lead>Couples</Lead> may use the core planning features at no cost.
            </Item>
            <Item>
              <Lead>Vendors</Lead> may create a free listing and optionally subscribe to a paid plan
              (&ldquo;Vendor &mdash; Pro&rdquo; or &ldquo;Vendor &mdash; Featured&rdquo;) for
              additional features.
            </Item>
          </List>
          <P>
            We may add, change, or remove features. We may also set reasonable usage limits
            (including on AI features) to keep the Service reliable and to control costs.
          </P>
        </Section>

        <Section n={4} title="AI features">
          <P>
            The Service includes AI-assisted planning tools. AI output is generated automatically,
            may be inaccurate or incomplete, and is <Lead>not</Lead> professional, legal, financial,
            medical, or other expert advice. AI features require an internet connection and may be
            rate-limited. Always confirm important details (budgets, contracts, dates, vendor terms)
            independently before relying on them.
          </P>
        </Section>

        <Section n={5} title="Vendor subscriptions, billing, and automatic renewal">
          <P>
            This Section applies to paid vendor plans. <Lead>Couple accounts are free and are not
            billed.</Lead>
          </P>
          <P>
            <Lead>Plans and price.</Lead> Paid plans are &ldquo;Vendor &mdash; Pro&rdquo; at
            $29/month and &ldquo;Vendor &mdash; Featured&rdquo; at $79/month. Prices are shown at
            checkout and exclude any applicable taxes.
          </P>
          <Callout>
            <P>
              <Lead>Automatic renewal &mdash; please read.</Lead> Paid plans are billed in advance on
              a <Lead>monthly</Lead> basis and <Lead>renew automatically for successive monthly terms
              at the then-current price until you cancel.</Lead> We will charge the payment method on
              file for each renewal. You may cancel at any time from{" "}
              <Lead>Account &rarr; Billing</Lead> (or the billing portal linked there). Cancellation
              stops future renewals; you keep paid features through the end of the period you have
              already paid for.
            </P>
          </Callout>
          <Callout>
            <P>
              <Lead>Refunds.</Lead> Except where required by law, <Lead>all payments are
              non-refundable.</Lead> Once a billing cycle begins and your subscription renews, that
              payment has been processed for the upcoming term and is not eligible for a refund, in
              whole or in part. Cancelling, deactivating, or closing your account does not create a
              prorated or partial refund for the remaining time in your current period &mdash; you
              keep access until it ends. To avoid the next charge, cancel before your renewal date.
            </P>
          </Callout>
          <P>
            <Lead>Price changes.</Lead> We may change subscription prices. We will give you at least
            30 days&rsquo; notice before a change takes effect, and the new price applies at your
            next renewal. If you do not agree, cancel before renewal.
          </P>
          <P>
            <Lead>Payment processing.</Lead> Payments are processed by Stripe, our third-party
            payment processor; we do not store full card numbers. You authorize us and Stripe to
            charge your payment method for all amounts due.
          </P>
        </Section>

        <Section n={6} title="Your content and license to us">
          <P>
            You retain ownership of the content you create or upload (planning data, photos,
            listings, posts, reviews, and messages &mdash; &ldquo;User Content&rdquo;).
          </P>
          <P>
            You grant us a worldwide, non-exclusive, royalty-free, sublicensable license to host,
            store, reproduce, adapt, publish, and display your User Content <Lead>solely to operate,
            provide, and promote the Service</Lead>. For content you post publicly (such as vendor
            galleries, community posts, or inspiration you share), this license also covers
            displaying it to other users and, where you enable sharing, to third parties. This
            license ends when you delete the content or your account, except for (a) content others
            have re-shared or saved, (b) residual backups, and (c) content we must retain to comply
            with law.
          </P>
          <P>
            You represent that you have the rights to your User Content and that it does not
            infringe others&rsquo; rights or violate these Terms.
          </P>
        </Section>

        <Section n={7} title="Acceptable use">
          <P>
            You agree not to: break the law; infringe intellectual-property or privacy rights; post
            false, misleading, defamatory, harassing, or harmful content; impersonate others; upload
            malware; scrape or harvest data; probe or circumvent security; misuse AI features to
            generate prohibited content; or interfere with the Service. We may remove content and
            suspend or terminate accounts that violate these Terms.
          </P>
        </Section>

        <Section n={8} title="Vendor listings and accuracy">
          <P>
            Vendors are responsible for the accuracy of their listings, pricing, and availability.
            Listings that have not been claimed or verified by the business may be labeled as
            unverified. If you believe a listing about your business is inaccurate, contact{" "}
            <MailLink address="hello@bridalteam.com" /> to claim it or request a correction.
          </P>
        </Section>

        <Section n={9} title="Intellectual property">
          <P>
            The Service, including its software, design, and trademarks, is owned by Bridal Team,
            LLC or its licensors and is protected by law. We grant you a limited, revocable,
            non-transferable license to use the Service for its intended purpose. You may not copy,
            modify, distribute, or create derivative works except as permitted by these Terms.
          </P>
          <P>
            If you believe content on the Service infringes your copyright, contact{" "}
            <MailLink address="info@bridalteam.com" /> with enough detail to identify the work and
            the material you are reporting. We may remove infringing content and terminate repeat
            infringers.
          </P>
        </Section>

        <Section n={10} title="Third-party services">
          <P>
            The Service integrates or links to third-party services (for example, payment, hosting,
            AI, email, and image providers listed in our{" "}
            <Link href="/privacy" className="font-semibold text-brand-text underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            ). We are not responsible for third-party services, and your use of them may be governed
            by their own terms.
          </P>
        </Section>

        <Section n={11} title="Termination">
          <P>
            You may stop using the Service and delete your account at any time. We may suspend or
            terminate your access if you violate these Terms or to protect the Service or other
            users. On account deletion we remove your personal data as described in the Privacy
            Policy; if you co-manage a shared wedding with others, we remove you from it without
            deleting the shared plan.
          </P>
        </Section>

        <Section n={12} title="Disclaimers">
          <Allcaps>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without
            warranties of any kind, express or implied, including merchantability, fitness for a
            particular purpose, and non-infringement. We do not warrant that the Service will be
            uninterrupted, error-free, or secure, or that AI output will be accurate.
          </Allcaps>
        </Section>

        <Section n={13} title="Limitation of liability">
          <Allcaps>
            To the maximum extent permitted by law, Bridal Team, LLC and its affiliates will not be
            liable for any indirect, incidental, special, consequential, or punitive damages, or for
            lost profits, data, or goodwill. Our total liability for any claim relating to the
            Service will not exceed the greater of $100 or the amounts you paid us in the 12 months
            before the event giving rise to the claim.
          </Allcaps>
        </Section>

        <Section n={14} title="Indemnification">
          <P>
            You agree to indemnify and hold harmless Bridal Team, LLC from claims, damages, and
            expenses (including reasonable attorneys&rsquo; fees) arising from your User Content,
            your use of the Service, or your violation of these Terms or the rights of others.
          </P>
        </Section>

        <Section n={15} title="Governing law and venue">
          <P>
            These Terms are governed by the laws of the State of Florida, without regard to its
            conflict-of-laws rules. The exclusive venue for any dispute is the state and federal
            courts located in the State of Florida, and you and Bridal Team, LLC consent to personal
            jurisdiction there.
          </P>
        </Section>

        <Section n={16} title="Changes to these Terms">
          <P>
            We may update these Terms. If we make material changes, we will provide notice (for
            example, by email or in-app) before they take effect. Continued use after the effective
            date means you accept the updated Terms.
          </P>
        </Section>

        <Section n={17} title="Contact and legal notices">
          <P>Questions or legal notices:</P>
          <List>
            <Item>
              <Lead>Bridal Team, LLC</Lead>
            </Item>
            <Item>
              Legal notices: <MailLink address="info@bridalteam.com" />
            </Item>
            <Item>
              General and support: <MailLink address="hello@bridalteam.com" />
            </Item>
          </List>
        </Section>

        <Section n={18} title="General">
          <P>
            These Terms and the Privacy Policy are the entire agreement between you and us regarding
            the Service. If any provision is unenforceable, the rest remain in effect. Our failure to
            enforce a provision is not a waiver. You may not assign these Terms without our consent;
            we may assign them in connection with a merger, acquisition, or sale of assets.
          </P>
        </Section>
      </LegalBody>
    </>
  );
}
