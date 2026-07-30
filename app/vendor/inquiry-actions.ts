"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { sendEmail, emailLayout } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

function str(v: FormDataEntryValue | null, max: number) {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

export type Inquiry = {
  id: string;
  from_name: string;
  from_email: string;
  message: string;
  read: boolean;
  created_at: string;
};

export type InquiryState = { error: string | null; sent: boolean };

/**
 * A signed-in couple sends an inquiry to a vendor. RLS enforces that the vendor
 * accepts inquiries (Pro/Featured) and that the sender is themselves, so a Free
 * vendor's insert is rejected. Emails the vendor best-effort.
 */
export async function sendInquiry(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const vendorOrgId = String(formData.get("vendor_org_id") ?? "");
  const name = str(formData.get("name"), 120);
  const email = str(formData.get("email"), 200);
  const message = str(formData.get("message"), 2000);

  if (!vendorOrgId) return { error: "Missing vendor.", sent: false };
  if (!name || !email || !message) return { error: "Name, email and a message are required.", sent: false };

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to send an inquiry.", sent: false };

  const { error } = await supabase.from("vendor_inquiries").insert({
    vendor_org_id: vendorOrgId,
    from_user_id: user.id,
    from_name: name,
    from_email: email,
    message,
  });
  if (error) {
    // RLS rejects the insert if this vendor doesn't accept inquiries.
    console.error("sendInquiry failed:", error.code, error.message);
    return { error: "Couldn't send your inquiry. This vendor may not be accepting inquiries.", sent: false };
  }

  const { data: profile } = await supabase
    .from("vendor_profiles")
    .select("business_name, email")
    .eq("org_id", vendorOrgId)
    .maybeSingle();
  if (profile?.email) {
    await sendEmail({
      to: profile.email,
      subject: `New inquiry from ${name} on Bridal Team`,
      html: emailLayout(
        "You have a new inquiry",
        `<strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}) sent you a message:<br/><br/>${escapeHtml(message)}`,
        { label: "View in your dashboard", url: `${SITE_URL}/vendor` },
      ),
    }).catch(() => undefined);
  }

  return { error: null, sent: true };
}

/** The vendor's inquiries, newest first. RLS restricts to the vendor's team. */
export async function listVendorInquiries(orgId: string): Promise<Inquiry[]> {
  if (!orgId) return [];
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("vendor_inquiries")
    .select("id, from_name, from_email, message, read, created_at")
    .eq("vendor_org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("listVendorInquiries failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as Inquiry[];
}

/** Mark an inquiry read (RLS restricts to the owning vendor team). */
export async function markInquiryRead(id: string): Promise<{ ok: boolean }> {
  if (!id) return { ok: false };
  const supabase = await supabaseServer();
  const { error } = await supabase.from("vendor_inquiries").update({ read: true }).eq("id", id);
  if (error) {
    console.error("markInquiryRead failed:", error.code, error.message);
    return { ok: false };
  }
  revalidatePath("/vendor");
  return { ok: true };
}
