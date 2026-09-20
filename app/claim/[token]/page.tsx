import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/page-hero";
import ClaimButton from "@/components/claim-button";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

/**
 * The page an outreach "claim your listing" link opens.
 *
 * Never indexed. The URL *is* the credential, and a claim link in a search
 * result is a claim link anyone can use — robots.ts disallows /claim as well,
 * because a meta tag only helps for a page a crawler has already fetched.
 */
export const metadata: Metadata = {
  title: "Claim your listing",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Preview = {
  org_id: string;
  business_name: string;
  category: string | null;
  city: string | null;
  region: string | null;
  website: string | null;
  description: string | null;
  claimed: boolean;
  expired: boolean;
};

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero eyebrow="For vendors" title={title} />
      <section className="mx-auto max-w-md px-5 py-16">{children}</section>
    </>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-8 text-center shadow-card">
      <p className="text-sm leading-relaxed text-ink-soft/80">{children}</p>
      <Link
        href="/for-vendors"
        className="mt-6 inline-block rounded-full border border-stone-2 px-6 py-2.5 text-sm font-medium text-ink hover:border-brand hover:text-brand-text"
      >
        About listing with us
      </Link>
    </div>
  );
}

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await supabaseServer();

  const { data, error } = await supabase.rpc("get_claim_preview", { p_token: token });
  const preview = (Array.isArray(data) ? data[0] : data) as Preview | undefined;

  if (error) console.error("claim preview failed:", error.code, error.message);

  // One message for "no such token" and for a malformed one. There is nothing
  // useful to tell someone holding a link that was never real, and being
  // specific would only help someone probing for valid ones.
  if (!preview) {
    return (
      <Shell title="This link isn't valid">
        <Note>
          We couldn&rsquo;t find a listing for this link. It may have been mistyped, or
          the listing may have been removed. If someone from Bridal Team emailed you,
          reply to that message and we&rsquo;ll sort it out.
        </Note>
      </Shell>
    );
  }

  if (preview.claimed) {
    return (
      <Shell title="Already claimed">
        <Note>
          <strong className="text-ink">{preview.business_name}</strong> has already been
          claimed. If that was you, sign in to manage it. If it wasn&rsquo;t, email us and
          we&rsquo;ll get it back to you.
        </Note>
      </Shell>
    );
  }

  if (preview.expired) {
    return (
      <Shell title="This link has expired">
        <Note>
          The claim link for <strong className="text-ink">{preview.business_name}</strong>{" "}
          has expired. Reply to the email we sent and we&rsquo;ll send you a fresh one.
        </Note>
      </Shell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const location = [preview.city, preview.region].filter(Boolean).join(", ");
  const next = encodeURIComponent(`/claim/${token}`);

  return (
    <Shell title="Claim your listing">
      <div className="space-y-6">
        <div className="rounded-2xl border border-stone-2 bg-white p-8 shadow-card">
          <p className="text-xs uppercase tracking-wide text-ink-soft/50">
            We prepared this for you
          </p>
          <h2 className="mt-2 text-xl font-medium text-ink">{preview.business_name}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            {preview.category && (
              <div className="flex gap-2">
                <dt className="text-ink-soft/50">Category</dt>
                <dd className="text-ink">{preview.category}</dd>
              </div>
            )}
            {location && (
              <div className="flex gap-2">
                <dt className="text-ink-soft/50">Location</dt>
                <dd className="text-ink">{location}</dd>
              </div>
            )}
            {preview.website && (
              <div className="flex gap-2">
                <dt className="text-ink-soft/50">Website</dt>
                <dd className="text-ink">{preview.website}</dd>
              </div>
            )}
          </dl>
          {preview.description && (
            <p className="mt-4 text-sm leading-relaxed text-ink-soft/85">
              {preview.description}
            </p>
          )}
          <p className="mt-5 rounded-lg bg-stone-4 px-4 py-3 text-xs leading-relaxed text-ink-soft/75">
            It isn&rsquo;t live. Nothing here is visible to anyone until you claim it and
            choose to publish — and we may well have got details wrong, which is rather
            the point of handing it to you.
          </p>
        </div>

        {/* Claiming needs an account, and accounts only exist once the planner
            app is switched on. Saying so beats a sign-up link that 404s. */}
        {!SHOW_PLANNER_APP ? (
          <Note>
            Accounts aren&rsquo;t open quite yet. Reply to the email we sent and
            we&rsquo;ll let you know the moment this listing is yours to take.
          </Note>
        ) : user ? (
          <ClaimButton token={token} />
        ) : (
          <div className="rounded-2xl border border-stone-2 bg-white p-8 text-center shadow-card">
            <p className="text-sm leading-relaxed text-ink-soft/80">
              Create a free account to take ownership of this page. It takes about a
              minute, and there&rsquo;s no card involved.
            </p>
            <Link
              href={`/auth/signup?next=${next}`}
              className="mt-5 inline-block w-full rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Create an account and claim it
            </Link>
            <p className="mt-4 text-xs text-ink-soft/60">
              Already have one?{" "}
              <Link href={`/auth/login?next=${next}`} className="text-brand-text hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}
