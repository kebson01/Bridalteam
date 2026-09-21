# Video prompts for bridalteam.com

Prompts for AI video generators (Sora, Veo, Runway, Kling) to produce a launch
film for Bridal Team. Everything here is written against what the site actually
is today — the brand system in `app/globals.css`, the copy in
`components/hero.tsx` and `components/pillars.tsx`, and the feature flags in
`lib/flags.ts` — so the film doesn't promise a product we don't ship yet.

## What the film is allowed to claim

True today, and safe to say on screen:

- **The AI planner is live and free to try** — `/planner` works signed-out, no
  card, no key (`app/api/plan/route.ts` falls back to demo mode).
- **One place for the whole wedding** — timelines, budgets, guest list, RSVPs,
  mood boards, a public wedding website.
- **Plan with your team** — partner, family and vendors on the same plan.
- **Installs from the browser** — it's a PWA, no app store.

Not true today. Keep it off screen:

- **"Sign up free"** as a call to action. `SHOW_PLANNER_APP` is off, so
  `/signup` is a **waitlist**. The end card should say *Try the AI planner* or
  *Join the waitlist* — never "create your account". (The hero's own "Open your
  free account today" line is ahead of the flag; don't copy it into the film.)
- **A vendor directory.** `SHOW_VENDOR_DIRECTORY` is off and there are no
  published listings. No shot of a browsable grid of vendors, no "thousands of
  vendors" voiceover.
- **Social proof.** No invented counts, five-star reviews, or "loved by 10,000
  couples" supers.

## Brand spec — paste this into any generator that takes a style block

```
Brand: Bridal Team (bridalteam.com). Warm, sunlit, unfussy — real couples, not
a luxury fashion campaign. Signature orange #ff8c1c with a deeper #f36705 for
gradients; near-black #222222; warm off-whites and soft stone greys. Type is
geometric sans, uppercase, wide letter-spacing for headlines (Jost), plain
humanist sans for body (Raleway). Signature look: a warm orange wash gradient
over a photographic scene, like light through a window at golden hour.
Camera: 35mm and 50mm primes, shallow depth of field, handheld with gentle
float. Grade: warm highlights, soft lifted blacks, natural skin tones.
Mood: fun, calm, organised — relief, not stress.
```

## 1. Primary 30-second brand film — single prompt

For a generator that takes one long prompt with audio (Sora 2, Veo 3).

```
A 30-second warm, cinematic brand film for an AI-powered wedding planning
platform. Shot on 35mm primes, handheld with a gentle float, golden-hour light,
natural skin tones, shallow depth of field.

Open on a couple in their late twenties at a kitchen table at dusk, surrounded
by the chaos of planning: printed venue quotes, a laptop with a dozen tabs,
sticky notes, a swatch of fabric, two phones face-up. They look at each other
and laugh — tired, not miserable. Warm lamplight, wide 35mm, slow push in.

Cut to a close, tactile insert: a hand slides a phone across the table. On the
screen, a clean white interface with a single orange accent, a short typed
question and an answer appearing line by line. Screen glow warms their faces.

Cut to a montage, each beat two to three seconds, all in the same warm light:
a timeline of checkboxes ticking over on a tablet propped against a fruit bowl;
a mother and a bridesmaid at a cafe pointing at the same phone; a florist in a
sunlit workshop checking a message between buckets of eucalyptus; a hand pinning
three images to a mood board.

Push through to the day itself: a courtyard reception at golden hour, string
lights just coming on, a table settling, guests finding their place cards,
the couple mid-first-dance seen through a gap in the crowd. No slow-motion
clichés, no confetti cannon.

Close on the couple sitting on the edge of the dance floor, shoes off, sharing
a plate, laughing. The frame holds. A warm orange gradient wash rises over the
image and resolves to a clean white end card.

Colour: signature orange #ff8c1c into #f36705, near-black #222222, warm
off-white. Documentary realism, no stock-footage gloss, no text overlays
generated inside the shots — leave the end card empty for titling in post.

Audio: a light acoustic bed — fingerpicked guitar, soft claps, a warm pad —
building gently and resolving on the final frame. Room tone and real diegetic
sound over the dialogue-free montage: pen on paper, a phone buzz, a kettle,
laughter, distant music at the reception.
```

**Titling in post** (not inside the generated frames — generators mangle type):

| Time | Super |
| --- | --- |
| 0:03 | FUN, SIMPLE WEDDING PLANNING. |
| 0:08 | AN AI PLANNER THAT NEVER SLEEPS |
| 0:14 | ORGANIZE DETAILS. FIND IDEAS. |
| 0:20 | COLLABORATE WITH YOUR TEAM. |
| 0:27 | Bridal Team · bridalteam.com · *Try the AI planner — free* |

Headlines uppercase, light weight, `0.12em` tracking, white with a soft drop
shadow over footage; end card is near-black `#222222` on white with the logo
(`public/brand/logo.svg`) and one orange rule.

### Optional voiceover

Warm, unhurried, mid-register, no hard sell. 30 seconds at a natural pace:

> Planning a wedding is a hundred small decisions, and nobody hands you the
> list. *(beat)* Bridal Team keeps all of it in one place — the timeline, the
> budget, the guest list, the ideas you keep screenshotting. And now there's an
> AI planner who's done this before: what to book, when to book it, and what a
> fair price looks like. *(beat)* Bring your partner. Bring your mum. Bring the
> florist. *(beat)* Fun, simple wedding planning. Try the AI planner free at
> bridalteam.com.

## 2. Shot-by-shot — for 5-to-10-second clip generators

Most generators cap out around eight seconds. Generate these six separately and
cut them together; the style block above goes at the top of every one.

**Shot 1 — The mess (0:00–0:05)**
```
Wide 35mm handheld, kitchen table at dusk, warm lamplight. A couple in their
late twenties sits behind a spread of printed venue quotes, an open laptop with
many tabs, sticky notes and two phones. She pushes her hair back and laughs; he
shakes his head, smiling. Slow push in. Shallow depth of field, warm grade,
documentary realism, no text on screen.
```

**Shot 2 — The turn (0:05–0:10)**
```
Tight 50mm insert, same kitchen, same light. A hand slides a phone across the
table into frame. On the screen a clean white app interface with a single orange
accent: a short typed question, then an answer appearing line by line. The
screen glow warms both faces as they lean in. Rack focus from the phone to their
eyes. No legible text on the screen — keep UI copy soft and out of focus.
```

**Shot 3 — The team (0:10–0:16)**
```
Three quick handheld beats in warm daylight, matched grade. A mother and a
bridesmaid at a sunlit cafe table laughing at the same phone. A florist in a
bright workshop glancing at a message between buckets of eucalyptus. A hand
pinning three photographs to a mood board on a wall. Natural light, soft
shadows, real textures, documentary style.
```

**Shot 4 — Control (0:16–0:21)**
```
Overhead 50mm, a tablet propped against a fruit bowl on a wooden table, morning
light across it. A finger ticks down a list of checkboxes, each one settling
with a small satisfying motion. Coffee cup, pen, a single sprig of eucalyptus
in frame. Warm, calm, tidy — relief rather than excitement. UI kept abstract
and out of focus.
```

**Shot 5 — The day (0:21–0:27)**
```
Golden-hour courtyard reception, string lights warming on as the sun drops.
Handheld 35mm drifting through: a long table settling, guests finding place
cards, a hand on a shoulder. Then through a gap in the crowd, the couple
mid-first-dance, slightly soft, backlit by the string lights. Natural motion,
no slow motion, no confetti.
```

**Shot 6 — End (0:27–0:30)**
```
The couple sits on the edge of the dance floor, shoes off, sharing a plate,
laughing quietly at something off camera. Static 50mm, shallow focus, warm
string lights bokeh behind them. Hold the frame steady for the full duration,
then a warm orange gradient wash (#ff8c1c to #f36705) rises over the image and
fills the frame. Leave the final second clean for an end card.
```

## 3. Six-second social cut (vertical 9:16)

For Reels, TikTok and paid social. Same style block, vertical framing.

```
Vertical 9:16, six seconds, warm handheld. Three beats, two seconds each.
One: a couple at a kitchen table buried in printed quotes and sticky notes,
laughing in frustration, warm lamplight. Two: a hand slides a phone across the
table; a clean white interface with a single orange accent answers line by line;
their faces lift. Three: golden-hour reception, string lights, the couple
mid-first-dance through a gap in the crowd. Documentary realism, shallow depth
of field, warm grade, no text generated in frame. Audio: one acoustic guitar
phrase resolving on the last beat.
```

Supers in post: **"1,000 decisions."** → **"One AI planner."** → **"Bridal Team
— try it free."**

## 4. Vendor-facing variant (20 seconds)

For `/for-vendors`. Keep it to the honest pitch in `VENDOR-OUTREACH.md` — a page
they control, free, no card — not lead volume.

```
A 20-second warm, documentary-style film about small wedding businesses. Shot
handheld on 35mm, natural light, real workspaces.

A florist ties stems at a bench in a bright workshop. A photographer scrolls
back through frames on a camera's screen in a car with the door open. A caterer
plates in a warm kitchen, steam catching the window light. A DJ coils a cable
in an empty hall at golden hour, chairs already set.

Between them, quiet inserts of a hand on a phone: a short message arriving, a
profile page with photographs filling a clean white layout with a single orange
accent. Nothing dramatic, nothing polished — competence and quiet pride.

End on the florist stepping back to look at a finished arrangement, satisfied.
Warm orange gradient wash rises and resolves to a clean white end card.

Colour: orange #ff8c1c into #f36705, near-black #222222, warm off-white.
Audio: sparse piano and room tone — scissors, tape, a kitchen, a room settling.
```

Supers: **"You're good at the work."** → **"The listing shouldn't be another
job."** → **"A free page you control. Bridal Team."**

## 5. Negative prompt

Paste into any generator with a negative field; otherwise append as "avoid".

```
no on-screen text, no captions, no watermarks, no logos, no garbled UI type,
no readable interface copy, no stock-footage gloss, no luxury-fashion styling,
no cathedral or ballroom grandeur, no drone establishing shots, no confetti
cannons, no slow-motion bouquet toss, no champagne-pour cliché, no plastic
smiles or posed group photos, no over-saturated teal-and-orange grade, no
blown-out highlights, no distorted hands, no extra fingers, no morphing faces,
no crowds of identical people, no visible brand names on clothing or products
```

## 6. Assembly notes

- **Generate the end card in post, never in the model.** Every generator
  garbles type and wordmarks. Land the last shot clean and composite the logo,
  the URL and the call to action over it.
- **Match grade across clips.** Generated shots drift; a single warm LUT and a
  consistent white balance pass is what makes six separate generations read as
  one film.
- **Keep the UI abstract.** Any shot of a phone or tablet should show a clean
  white layout with one orange accent and soft, unreadable copy. If you want
  the real interface on screen, screen-record `/planner` and composite it into
  the device — don't ask the model to draw it.
- **Cast realistically.** Mixed ages and backgrounds, ordinary clothes, one
  scene that's clearly a small backyard or a courtyard rather than a venue.
  The brand is "fun and simple", not aspirational luxury.
- **Aspect ratios.** 16:9 for the site hero and YouTube, 9:16 for social, 1:1
  crop for the feed. Frame the 16:9 shots with headroom so the vertical crop
  survives.
- **Music rights.** Generated audio beds vary in licensing; for anything paid,
  replace the model's score with a licensed track before it runs.
