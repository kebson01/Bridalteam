# Scheduling pins through PinBridge

1. **Point at a pushed commit.** PinBridge fetches each image from a public
   URL. The images don't need to be on `main`: use the SHA of the pushed
   commit that added them. That can be the merge commit, or the PR branch
   commit before the merge. GitHub keeps a PR's commits reachable through
   `refs/pull/<n>/head` even after a squash merge deletes the branch. A
   fixed SHA also means a later change can't swap an image:

   ```
   https://raw.githubusercontent.com/kebson01/Bridalteam/<commit-sha>/marketing/pinterest/<batch>/<file>.png
   ```

   Check that every URL returns `200 image/png` with `curl` before scheduling.
   Batch 6 was scheduled this way, from its PR commit.
2. **Check the workspace.** Call `list_pinterest_accounts` and note the
   `workspace_id` and the account `id`.
   - The PinBridge connection has switched workspaces before:
     - `5cf336ec` holds batch 2;
     - `36cd9917` holds batch 1, 3 and 4.
   - Both post to the same Pinterest user, `kebsaint`, but neither can see the
     other's schedules.
   - If the workspace differs from the one the tracker says the last batch
     used, tell the user. Don't re-create schedules that may still exist
     elsewhere; they would double-post.
3. **See what's already queued.** Call `list_schedules` with
   `status=scheduled` and `sort=run_at_asc`. Start the new batch the day after
   the last queued pin.
4. **Check the boards.** Call `list_boards`. Create a new board with
   `create_board` only if the user agreed to it, and check that the name isn't
   taken first.
5. **Dry run the first pin.** Call `create_schedule` with `dry_run=true`. Every
   check must pass: account, media, board access, billing, quota (50 pins a
   month per workspace) and rate headroom.
6. **Schedule one pin a day at 8:13 pm Eastern.** Always give `run_at` with an
   explicit offset:
   - EDT, `-04:00`, runs until the first Sunday of November;
   - EST, `-05:00`, runs from then until the second Sunday of March;
   - for example, `2026-11-09T20:13:00-05:00`.

   Reuse the exact title, description, alt text and link from the batch notes.
   A repeat call creates a duplicate, so after a timeout, check
   `list_schedules` before resending.
7. **Log it.** In `COUPLES-TRACKER.md`:
   - add one Posts row per pin, with the date, board, what's on it,
     `(scheduled 8:13 pm ET)`, its utm tags and status `scheduled`;
   - add a log line naming the workspace, the dates and the image commit.
8. **Set a follow-up.** Use `send_later` for the morning after the last pin.
   Its message gives the workspace, account and schedule ids, and asks to:
   - collect the pin URLs;
   - retry or report failures;
   - offer the tracker update.

## After they publish

Swap each `(scheduled …)` for the pin URL and mark it `posted`. Seven days
later, record that page's visits where `source = 'pinterest'`.
