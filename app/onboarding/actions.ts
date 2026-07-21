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

  const rawType = formData.get("account_type");

  // Vendors take a separate path: a vendor org + profile, no wedding.
  if (rawType === "vendor") {
    const businessName = str(formData.get("business_name"), 160);
    const category = str(formData.get("vendor_category"), 80);
    if (!businessName) return { error: "What's your business called?" };

    const { error } = await supabase.rpc("create_vendor_account", {
      p_business_name: businessName,
      p_category: category,
    });
    if (error) {
      console.error("create_vendor_account failed:", error.code, error.message);
      return { error: "We couldn't create your vendor account. Please try again." };
    }
    redirect("/vendor");
  }

  const accountType = rawType === "planner_company" ? "planner_company" : "couple";
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

  // One RPC rather than four inserts. Creating the org from the client fails on
  // RLS: supabase-js emits `INSERT ... RETURNING`, and RETURNING requires the
  // new row to pass the SELECT policy (is_org_member), which can't be true
  // before the membership exists. The function is SECURITY DEFINER and derives
  // every row from auth.uid(), so it also makes the whole setup atomic.
  const { data, error } = await supabase.rpc("create_workspace", {
    p_type: accountType,
    p_org_name: orgName,
    p_partner_one: partnerOne,
    p_partner_two: partnerTwo,
    p_event_date: eventDate || null,
    p_city: city,
    p_guest_count: guestCount,
    p_budget_cents: budgetCents,
    p_style: style,
  });

  if (error) {
    console.error("create_workspace failed:", error.code, error.message);
    return { error: "We couldn't create your workspace. Please try again." };
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (result?.wedding_id) redirect(`/w/${result.wedding_id}`);
  redirect("/dashboard");
}
