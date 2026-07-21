import { SITE_NAME } from "@/lib/site";

/**
 * Transactional email via Resend's HTTP API.
 *
 * Uses RESEND_API_KEY from the environment. If it isn't set, sending is skipped
 * and callers fall back to sharing a link manually — so features that email
 * (invites, reminders) still work, just without the automatic send. This is the
 * SAME Resend account that powers Supabase auth email; the key here lets the app
 * send its own transactional mail too.
 */

const FROM = `${SITE_NAME} <noreply@bridalteam.com>`;

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "no_api_key" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Resend send failed:", res.status, detail.slice(0, 300));
      return { sent: false, reason: `status_${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error("Resend send threw:", err);
    return { sent: false, reason: "threw" };
  }
}

/** A simple branded wrapper for transactional emails. */
export function emailLayout(heading: string, body: string, cta?: { label: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f6f4f1;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border-radius:16px;padding:32px;">
        <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#2b2320;">${heading}</h1>
        <div style="font-size:15px;line-height:1.6;color:#4a423d;">${body}</div>
        ${
          cta
            ? `<div style="margin-top:24px;"><a href="${cta.url}" style="display:inline-block;background:#f2670c;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:999px;">${cta.label}</a></div>`
            : ""
        }
      </div>
      <p style="text-align:center;color:#9a938d;font-size:12px;margin-top:16px;">Bridal Team — fun, simple wedding planning</p>
    </div>
  </body></html>`;
}
