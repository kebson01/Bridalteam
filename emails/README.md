# Auth email templates

Branded HTML for every Supabase authentication email. All six share one shell
(defined in [`build.mjs`](./build.mjs)) — identical Bridal Team header lockup,
Jost/Raleway type, gradient pill button, and dark footer. Only the copy and
call-to-action differ.

## Files → Supabase templates

Paste each file into **Supabase Dashboard → Authentication → Email Templates**:

| File | Supabase template | Key variable |
| --- | --- | --- |
| `confirm-signup.html` | Confirm signup | `{{ .ConfirmationURL }}` |
| `magic-link.html` | Magic Link | `{{ .ConfirmationURL }}` |
| `reset-password.html` | Reset Password | `{{ .ConfirmationURL }}` |
| `invite.html` | Invite user | `{{ .ConfirmationURL }}` |
| `change-email.html` | Change Email Address | `{{ .ConfirmationURL }}`, `{{ .NewEmail }}` |
| `reauthentication.html` | Reauthentication | `{{ .Token }}` |

## Uploading to Supabase

Instead of pasting by hand, upload all six in one go with a personal access
token from https://supabase.com/dashboard/account/tokens:

```bash
SUPABASE_ACCESS_TOKEN=sbp_... node scripts/push-auth-emails.mjs --dry-run
SUPABASE_ACCESS_TOKEN=sbp_... node scripts/push-auth-emails.mjs
```

It only changes the template bodies, then reads them back to confirm.
Subjects and sender settings stay as set in the dashboard.

## Editing

Don't hand-edit the `.html` files — they're generated. Change the copy or shell
in `build.mjs`, then regenerate:

```bash
node emails/build.mjs
```

## Notes

- The logo loads from `https://bridalteam.com/icon-192.png` (hosted PNG — email
  clients strip inline SVG).
- Layout is table-based with all-inline styles plus an Outlook VML button
  fallback, for consistent rendering in Gmail, Apple Mail, and Outlook.
- Set the **sender name/address** (e.g. `Bridal Team <noreply@bridalteam.com>`)
  under Authentication → Email Templates / SMTP settings — that's separate from
  the message body.
