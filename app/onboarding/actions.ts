"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type OnboardingState = { error: string | null };

function str(v: FormDataEntryValue | null, max = 200) {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : null;
}

/**
 * Creates the account's organization, its first wedding, and the owner's
 * membership.
 *
 * Everything here runs as the signed-in user through RLS — no service-role
 * shortcut. The org_members insert relies on the bootstrap branch of the
 * "Admins add members, founders bootstrap" policy: you may add yourself to an
 * org that has no members yet, and only admins may add anyone after that.
 */
export async function createWorkspace(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You need to be signed in." };

  const accountType = formData.get("account_type") === "planner_company" ? "planner_company" : "couple";
  const isCompany = accountType === "planner_company";

  const companyName = str(formData.get("company_name"));
  const partnerOne = str(formData.get("partner_one"), 100);
  const partnerTwo = str(formData.get("partner_two"), 100);
  const eventDate = str(formData.get("event_date"), 10);
  const city = str(formData.get("city"), 100);
  const guestsRaw = str(formData.get("guest_count"), 10);
  const budgetRaw = str(formData.get("budget"), 20);
  const style = str(formData.get("style"), 200);

  if (isCompany && !companyName) return { error: "What's your company called?" };
  if (!isCompany && !partnerOne) return { error: "Tell us at least one of your names." };

  const guestCount = guestsRaw ? Number.parseInt(guestsRaw, 10) : null;
  if (guestCount !== null && (Number.isNaN(guestCount) || guestCount < 0 || guestCount > 100000)) {
    return { error: "That guest count doesn't look right." };
  }

  const budget = budgetRaw ? Number.parseFloat(budgetRaw.replace(/[^0-9.]/g, "")) : null;
  const budgetCents =
    budget !== null && Number.isFinite(budget) && budget >= 0 ? Math.round(budget * 100) : null;

  const orgName =
    companyName ?? [partnerOne, partnerTwo].filter(Boolean).join(" & ") ?? "My wedding";

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: orgName, type: accountType })
    .select("id")
    .single();

  if (orgError || !org) {
    console.error("org create failed:", orgError?.code, orgError?.message);
    return { error: "We couldn't create your workspace. Please try again." };
  }

  const { error: memberError } = await supabase
    .from("org_members")
    .insert({ org_id: org.id, user_id: user.id, role: "owner" });

  if (memberError) {
    console.error("org_members create failed:", memberError.code, memberError.message);
    return { error: "We couldn't set up your account. Please try again." };
  }

  // A planning company starts with an empty portfolio and adds weddings as
  // clients sign on. A couple gets their wedding immediately.
  if (isCompany) redirect("/dashboard");

  const { data: wedding, error: weddingError } = await supabase
    .from("weddings")
    .insert({
      org_id: org.id,
      owner_user_id: user.id,
      partner_one: partnerOne,
      partner_two: partnerTwo,
      event_date: eventDate || null,
      city,
      guest_count: guestCount,
      budget_cents: budgetCents,
      style,
    })
    .select("id")
    .single();

  if (weddingError || !wedding) {
    console.error("wedding create failed:", weddingError?.code, weddingError?.message);
    return { error: "We couldn't create your wedding. Please try again." };
  }

  const { error: wmError } = await supabase
    .from("wedding_members")
    .insert({ wedding_id: wedding.id, user_id: user.id, role: "couple", can_edit: true });

  if (wmError) {
    console.error("wedding_members create failed:", wmError.code, wmError.message);
    return { error: "We couldn't finish setting up. Please try again." };
  }

  redirect(`/w/${wedding.id}`);
}
