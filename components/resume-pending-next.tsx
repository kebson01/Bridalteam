"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { takePendingNext } from "@/lib/pending-next";

/**
 * Sends someone back to the claim or invite link they signed up from.
 *
 * Mounted on /onboarding because that is where the break landed: the auth
 * routes default here when the confirmation email does not carry `next`, so a
 * vendor who signed up from a claim link met an onboarding form and created a
 * second, unwanted listing. See lib/pending-next.ts for the full account.
 *
 * Renders a line of text rather than nothing. The redirect is near-instant,
 * but "nothing at all, briefly" is indistinguishable from a hung page, and
 * this only ever shows when a destination was genuinely stored.
 *
 * `replace`, not `push`: /onboarding should not sit in history as somewhere
 * the back button returns to, or a vendor gets bounced out of claiming by one
 * stray gesture.
 */
export default function ResumePendingNext() {
  const router = useRouter();
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    const next = takePendingNext();
    if (!next) return;
    setResuming(true);
    router.replace(next);
  }, [router]);

  if (!resuming) return null;

  return (
    <p className="mx-auto max-w-2xl px-5 pt-8 text-center text-sm text-ink-soft/70">
      Taking you back to your listing…
    </p>
  );
}
