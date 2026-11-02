---
name: human-voice
description: The last read before anything Bridal Team sends to the public. It strips the habits that give away machine-written text (emoji, em dashes, stock phrases like "I hope this email finds you well" or "delve", "not just X but Y", Title Case headlines, markdown asterisks, three-item lists everywhere) so posts, replies, emails and pitches sound like a real person wrote them. Every Bridal Team skill that drafts outward-facing text runs this pass before showing the draft. Also use it whenever the user says a message "sounds like AI", "sounds robotic", "too salesy", "make it sound human", "clean this up before I send it", or pastes any text they plan to post or send.
---

# Human voice: the last read before anything goes out

Goal: a couple, a vendor or a group admin reading a Bridal Team message
should feel a person wrote it to them. Machine-written text has habits that
people now spot at a glance, and once they spot it, they stop reading.

This applies to everything public: Facebook Page posts, group posts,
comment replies and messages, Pinterest pin text, vendor emails, call
scripts read aloud, press and directory pitches, Reddit answers. It doesn't
apply to internal files like trackers, reports and plans.

## The pass, every time

1. **Run the checker** on the draft:

   ```
   node scripts/human-voice.mjs <file>        # a post.json, .txt or .md
   echo "<draft>" | node scripts/human-voice.mjs -
   ```

   Fix every `✗`. Each `?` gets a second look: keep it only if a person
   would really write it that way.

2. **Read it as the person receiving it.** The script only catches surface
   habits. Go through `references/tells.md` for the ones it can't see:
   three-part lists, openers that warm up before the point, closers that
   summarize, the same sentence length over and over, praise that could be
   about anyone.

3. **Rewrite, don't patch.** Swapping "delve" for "look" in a sentence that's
   still built like a brochure doesn't help. If more than two things are
   wrong, write it again from "what do I actually want to tell this person?"

4. **Run the checker again** until it shows no `✗`.

5. **Show the user the final text.** Mention anything you kept on purpose,
   like a bulleted checklist that really is a checklist.

## What a Bridal Team message sounds like

- **Like the owner talking.** Short sentences, contractions, plain words. A
  bit warm, never gushing. Picture one person who runs a small wedding site
  and is good at it.
- **Specific.** Name the city, the month, the vendor's category, the thing
  they said. Generic praise ("your work is stunning!") is the biggest giveaway
  in outreach. Say what you actually noticed, or say nothing.
- **To the point.** The first sentence says why you're writing. No "I hope
  you're well", no "I wanted to reach out".
- **One ask.** Then stop. No summary, and no "let me know if you have any
  questions" closer.
- **Uneven on purpose.** Real writing mixes a long sentence with a short one,
  and two points with four. Not everything comes in threes.
- **Plain formatting.** No emoji, em dashes, bold, headings or hashtag
  strings. At most one exclamation mark. Bullets only for a real checklist
  the reader will use.
- **Honest.** Nothing in this pass changes what's true. Keep every fact,
  number and caveat the draft had. Bridal Team is new and small, and says so.

## Where it's enforced

- `node scripts/facebook-queue.mjs check` rejects any queued Facebook post with
  a `✗` tell, and the publishing run skips it. Fix the post on `main`.
- `lib/outreach/outreach.test.ts` fails if the vendor campaign emails pick
  one up.
- `emails/build.mjs` generates the signup and login emails. Run the checker
  on any copy you change there.

Everything else (group posts, replies, pitches, one-off emails) relies on
skills running this pass before showing a draft.
