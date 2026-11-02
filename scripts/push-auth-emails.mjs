// Uploads the auth email templates in emails/ to Supabase, so nobody has to
// paste six HTML files into the dashboard by hand.
//
//   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/push-auth-emails.mjs            upload
//   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/push-auth-emails.mjs --dry-run  show what would change
//
// The token is a personal access token from
// https://supabase.com/dashboard/account/tokens. The project defaults to Bridal
// Team's; set SUPABASE_PROJECT_REF to use another. Only the template bodies
// change. Subjects and sender settings stay as they are in the dashboard.
//
// Regenerate first if you edited the copy: node emails/build.mjs
//
// Only Node built-ins, so it runs without `npm ci`.

import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "yubcwyfhgxjnqydhgjit";

/** File in emails/ -> the Management API field that holds that template. */
export const TEMPLATE_FIELDS = {
  "confirm-signup.html": "mailer_templates_confirmation_content",
  "magic-link.html": "mailer_templates_magic_link_content",
  "reset-password.html": "mailer_templates_recovery_content",
  "invite.html": "mailer_templates_invite_content",
  "change-email.html": "mailer_templates_email_change_content",
  "reauthentication.html": "mailer_templates_reauthentication_content",
};

async function api(method, body) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error("Set SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens).");
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} config/auth failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const wanted = {};
  for (const [file, field] of Object.entries(TEMPLATE_FIELDS)) {
    wanted[field] = await readFile(path.join(root, "emails", file), "utf8");
  }

  const current = await api("GET");
  const changed = Object.keys(wanted).filter((field) => current[field] !== wanted[field]);
  for (const [file, field] of Object.entries(TEMPLATE_FIELDS)) {
    console.log(`${changed.includes(field) ? "~ changed " : "  same    "} ${file}`);
  }
  if (!changed.length) return console.log("All six templates are already up to date.");
  if (dryRun) return console.log(`Dry run: ${changed.length} template(s) would be updated.`);

  await api("PATCH", Object.fromEntries(changed.map((f) => [f, wanted[f]])));
  const after = await api("GET");
  const stale = changed.filter((f) => after[f] !== wanted[f]);
  if (stale.length) throw new Error(`Supabase didn't store: ${stale.join(", ")}`);
  console.log(`Updated ${changed.length} template(s) in project ${PROJECT_REF}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
