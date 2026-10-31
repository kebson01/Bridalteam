"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type SuggestResult = { ok: true } | { ok: false; error: string };

/**
 * A signed-in couple (or vendor) recommending a business we don't list.
 *
 * This only files a lead. suggest_vendor() writes it to vendor_leads as a
 * couple_referral / vendor_referral, which import_vendor_leads() never picks up
 * on its own: an admin checks it on /admin/leads first, because a name typed
 * into a form is a tip, not a published fact. Sign-in, length limits and the
 * daily cap are all enforced inside the database function, so posting to this
 * action directly gets no further than the form does.
 */
export async function suggestVendor(input: {
  business_name: string;
  category?: string;
  city?: string;
  website?: string;
  phone?: string;
  note?: string;
}): Promise<SuggestResult> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to recommend a vendor." };

  const name = String(input.business_name ?? "").trim();
  if (!name) return { ok: false, error: "Add the business name." };

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const { error } = await supabase.rpc("suggest_vendor", {
    p_business_name: name,
    p_category: str(input.category) || null,
    p_city: str(input.city) || null,
    p_website: str(input.website) || null,
    p_phone: str(input.phone) || null,
    p_note: str(input.note) || null,
  });

  if (error) {
    // The function's own messages are written for the person filling the form.
    if (error.code === "54000" || error.code === "22001" || error.code === "22023") {
      return { ok: false, error: error.message };
    }
    console.error("suggest_vendor failed:", error.code, error.message);
    return { ok: false, error: "Couldn't send that just now. Please try again." };
  }
  return { ok: true };
}
