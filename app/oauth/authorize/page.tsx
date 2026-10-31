import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import { supabaseServer } from "@/lib/supabase/server";
import { checkAuthorizeRequest, knownAssistant } from "@/lib/oauth/core";
import { oauthAvailable } from "@/lib/oauth/http";
import { approveConnection, denyConnection } from "./actions";

export const metadata: Metadata = {
  title: "Connect your assistant",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  choose: "Choose which wedding to connect.",
  signin: "Your session ended. Please log in again.",
  not_editor: "You need edit access to that wedding to connect an assistant to it.",
  too_many:
    "That wedding already has 5 assistant connections. Remove one under Website builder → Your own AI, then try again.",
  failed: "Something went wrong creating the connection. Please try again.",
  invalid: "This connection request isn't valid any more. Start again from your assistant.",
};

const OAUTH_FIELDS = ["client_id", "redirect_uri", "response_type", "code_challenge", "code_challenge_method", "state", "scope", "resource"];

/**
 * /oauth/authorize — where ChatGPT, Claude and other MCP clients send a couple
 * to connect their Bridal Team account. Log in, pick the wedding, approve.
 * See lib/oauth/core.ts for the flow.
 */
export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!oauthAvailable()) redirect("/");
  const raw = await searchParams;
  const params: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) params[k] = Array.isArray(v) ? v[0] : v;

  const check = checkAuthorizeRequest(params);
  if (!check.ok && "redirectTo" in check) redirect(check.redirectTo);
  if (!check.ok) {
    return (
      <>
        <PageHero eyebrow="Connect an assistant" title="This link didn't work" />
        <section className="mx-auto max-w-md px-5 py-16 text-ink-soft">
          <p>{check.showHere}</p>
        </section>
      </>
    );
  }
  const { request } = check;

  // Not signed in: log in, then come straight back here with the same query.
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const back = new URLSearchParams(
      OAUTH_FIELDS.flatMap((k) => (params[k] !== undefined ? [[k, params[k]!] as [string, string]] : [])),
    );
    redirect(`/auth/login?next=${encodeURIComponent(`/oauth/authorize?${back.toString()}`)}`);
  }

  const { data: weddings } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two, event_date")
    .order("event_date", { ascending: true, nullsFirst: false });

  const recognised = knownAssistant(request.redirectUri);
  const host = new URL(request.redirectUri).host;
  const error = params.bt_error ? ERRORS[params.bt_error] : undefined;
  const hidden = OAUTH_FIELDS.map((k) =>
    params[k] !== undefined ? <input key={k} type="hidden" name={k} value={params[k]} /> : null,
  );

  return (
    <>
      <PageHero eyebrow="Connect an assistant" title={`Connect ${request.client.name}`} />
      <section className="mx-auto max-w-md px-5 py-12">
        {error && <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}

        <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
          <p className="text-ink">
            <strong>{request.client.name}</strong> wants to help plan your wedding on Bridal Team.
          </p>
          <p className="mt-2 text-sm text-ink-soft/80">
            Signed in as {user.email}. It will be sent back to <strong>{host}</strong>
            {recognised ? ` (${recognised})` : ""}.
          </p>
          {!recognised && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              We don&apos;t recognise {host}. Only continue if you started this connection yourself.
            </p>
          )}

          <p className="mt-5 text-sm font-medium text-ink">For the wedding you choose, it will be able to see and change:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            <li>Wedding details: names, date, venue, guest count and total budget</li>
            <li>Checklist and deadlines</li>
            <li>Budget and expenses</li>
            <li>Guest list, RSVPs, meal options and seating, including guests&apos; emails</li>
            <li>Vendors, travel and hotel blocks, and floor plans</li>
            <li>Your wedding website (drafts, publishing) and registry links</li>
          </ul>
          <p className="mt-2 text-sm text-ink-soft/80">
            It can&apos;t send emails to your guests, manage your team, or see your account, payments or messages.
            Disconnect it any time under Website builder → Your own AI.
          </p>

          {!weddings || weddings.length === 0 ? (
            <p className="mt-6 text-sm text-ink-soft">
              You don&apos;t have a wedding yet.{" "}
              <Link href="/onboarding" className="font-semibold text-brand-text underline">
                Set one up
              </Link>{" "}
              and then connect again from your assistant.
            </p>
          ) : (
            <form action={approveConnection} className="mt-6">
              {hidden}
              <fieldset>
                <legend className="text-sm font-medium text-ink">Which wedding?</legend>
                <div className="mt-2 space-y-2">
                  {weddings.map((w, i) => (
                    <label key={w.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-2 px-3 py-2">
                      <input type="radio" name="wedding_id" value={w.id} defaultChecked={i === 0} required />
                      <span className="text-sm text-ink">
                        {[w.partner_one, w.partner_two].filter(Boolean).join(" & ") || "Untitled wedding"}
                        {w.event_date ? <span className="text-ink-soft/70"> · {w.event_date}</span> : null}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white"
                >
                  Allow
                </button>
                <button
                  type="submit"
                  formAction={denyConnection}
                  formNoValidate
                  className="rounded-full border border-stone-2 px-6 py-3 text-sm font-semibold text-ink"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
