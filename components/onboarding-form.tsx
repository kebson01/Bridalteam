"use client";

import { useActionState, useState } from "react";
import { createWorkspace, type OnboardingState } from "@/app/onboarding/actions";

const INPUT =
  "mt-1.5 w-full rounded-lg border border-stone-2 px-4 py-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60";

export default function OnboardingForm() {
  const [accountType, setAccountType] = useState<"couple" | "planner_company">("couple");
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    createWorkspace,
    { error: null },
  );

  const isCompany = accountType === "planner_company";

  return (
    <form action={formAction} className="rounded-2xl border border-stone-2 bg-white p-8 shadow-card">
      <input type="hidden" name="account_type" value={accountType} />

      <fieldset className="mb-8">
        <legend className="text-sm font-medium text-ink-soft">
          What brings you here?
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["couple", "I'm planning my wedding", "You and your wedding party"],
              ["planner_company", "I'm a wedding planner", "Manage weddings for clients"],
            ] as const
          ).map(([value, title, sub]) => (
            <button
              key={value}
              type="button"
              onClick={() => setAccountType(value)}
              aria-pressed={accountType === value}
              className={`rounded-xl border p-4 text-left transition-colors ${
                accountType === value
                  ? "border-brand bg-brand/5"
                  : "border-stone-2 hover:border-brand/50"
              }`}
            >
              <span className="block text-sm font-semibold text-ink">{title}</span>
              <span className="mt-1 block text-xs text-ink-soft/70">{sub}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {isCompany ? (
        <label className="mb-4 block">
          <span className="text-sm font-medium text-ink-soft">Company name</span>
          <input required name="company_name" disabled={pending} placeholder="Evergreen Events" className={INPUT} />
        </label>
      ) : (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-ink-soft">Your name</span>
              <input required name="partner_one" disabled={pending} placeholder="Alex" className={INPUT} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink-soft">Partner&rsquo;s name</span>
              <input name="partner_two" disabled={pending} placeholder="Sam" className={INPUT} />
            </label>
          </div>

          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-ink-soft">Wedding date</span>
              <input type="date" name="event_date" disabled={pending} className={INPUT} />
              <span className="mt-1.5 block text-xs text-ink-soft/60">
                Not sure yet? Leave it blank.
              </span>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink-soft">City</span>
              <input name="city" disabled={pending} placeholder="Austin, TX" className={INPUT} />
            </label>
          </div>

          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-ink-soft">Guests (roughly)</span>
              <input type="number" name="guest_count" min={0} disabled={pending} placeholder="150" className={INPUT} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink-soft">Budget</span>
              <input name="budget" inputMode="decimal" disabled={pending} placeholder="35000" className={INPUT} />
            </label>
          </div>

          <label className="mb-6 block">
            <span className="text-sm font-medium text-ink-soft">Style or vibe</span>
            <input name="style" disabled={pending} placeholder="Rustic autumn, candlelight, vineyard" className={INPUT} />
            <span className="mt-1.5 block text-xs text-ink-soft/60">
              The more you tell us, the better your plan will be.
            </span>
          </label>
        </>
      )}

      {state.error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
      >
        {pending ? "Setting things up…" : isCompany ? "Create my company workspace" : "Create my plan"}
      </button>
    </form>
  );
}
