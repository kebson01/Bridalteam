# Video prompts for bridalteam.com

Prompts for AI video generators (Sora, Veo, Runway, Kling) to produce a launch
film for Bridal Team. The film pulls up **bridalteam.com** on screen — the
address bar, the homepage hero and the AI planner answering — which is a
composite, not something the generator draws; section 6 is the recipe. Everything here is written against what the site actually
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

Cut to a close, tactile insert: a hand picks up a phone and types into the
browser's address bar. A website loads — a full-bleed photographic hero under a
warm orange gradient wash, a wide-tracked uppercase headline, two rounded
buttons. A thumb taps the white one and a planning assistant answers a typed
question line by line. The screen glow warms both faces as they lean in. Keep
the phone square to camera and steady through this beat.

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
off-white. Documentary realism, no stock-footage gloss. Do not generate text
overlays in the shots and do not attempt to render the website's own type —
every device screen is composited in post, so hold devices steady, square to
camera and unobstructed. Leave the end card empty for titling.

Audio: a light acoustic bed — fingerpicked guitar, soft claps, a warm pad —
building gently and resolving on the final frame. Room tone and real diegetic
sound over the dialogue-free montage: pen on paper, a phone buzz, a kettle,
laughter, distant music at the reception.
```

**Titling in post** (not inside the generated frames — generators mangle type):

| Time | Super |
| --- | --- |
| 0:03 | FUN, SIMPLE WEDDING PLANNING. |
| 0:07 | *(no super — the address bar reads `bridalteam.com`; let it play clean)* |
| 0:10 | AN AI PLANNER THAT NEVER SLEEPS |
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

Time the line "Bridal Team keeps all of it in one place" to land on the frame
where the homepage paints, so the name, the URL on screen and the VO hit
together.

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

**Shot 2 — Pulling up the site (0:05–0:10)**
```
Tight 50mm insert, same kitchen, same lamplight. A thumb types into a phone
browser's address bar and a website loads: a full-bleed photographic hero under
a warm orange gradient wash, a wide-tracked uppercase headline across it, a
small pill-shaped badge above, and two rounded buttons below — one solid white,
one outlined. The phone tilts toward the second face as they lean in, screen
glow warming both. Rack focus from the screen to their eyes. Hold the phone
steady and square to camera through the load so the screen can be replaced in
post.
```

Composite the real `bridalteam.com` homepage into the phone in post — the URL
bar reading **bridalteam.com**, the hero's orange wash, **FUN, SIMPLE WEDDING
PLANNING.**, the *Now with an AI planning team* badge and the white *Try the AI
planner* button. See the assembly notes: generators cannot render a real site.

**Shot 3 — The team (0:10–0:16)**
```
Three quick handheld beats in warm daylight, matched grade. A mother and a
bridesmaid at a sunlit cafe table laughing at the same phone. A florist in a
bright workshop glancing at a message between buckets of eucalyptus. A hand
pinning three photographs to a mood board on a wall. Natural light, soft
shadows, real textures, documentary style.
```

**Shot 4 — The planner answering (0:16–0:21)**
```
Overhead 50mm, a laptop open on a wooden table in morning light, screen square
to camera. On it a clean white web page with a single warm orange accent: a
short question typed into a chat box, then a reply building line by line beneath
it. A finger scrolls; a list of checkboxes ticks over. Coffee cup, pen, a sprig
of eucalyptus in frame. Warm, calm, tidy — relief rather than excitement. Keep
the laptop still and the screen unobstructed for the full take.
```

Screen-record `/planner` on `bridalteam.com` answering a real question — a
budget or timeline one — and track it onto the laptop in post.

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
laughing in frustration, warm lamplight. Two: a thumb types into a phone
browser's address bar and a website loads — a photographic hero under a warm
orange gradient wash, a wide-tracked uppercase headline, a white rounded button
— then a planning assistant answers line by line; their faces lift. Hold the
phone square to camera and steady for this whole beat. Three: golden-hour
reception, string lights, the couple mid-first-dance through a gap in the crowd.
Documentary realism, shallow depth of field, warm grade, no text generated in
frame. Audio: one acoustic guitar phrase resolving on the last beat.
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

Between them, quiet inserts of a hand on a phone: a short message arriving,
then a browser loading a website — a clean white page with a single warm orange
accent where a business's own photographs fill a profile layout. Hold the phone
square to camera and steady so the screen can be replaced in post. Nothing
dramatic, nothing polished — competence and quiet pride.

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
no invented website copy, no fake URLs or address-bar text, no hands covering
the phone or laptop screen, no stock-footage gloss, no luxury-fashion styling,
no cathedral or ballroom grandeur, no drone establishing shots, no confetti
cannons, no slow-motion bouquet toss, no champagne-pour cliché, no plastic
smiles or posed group photos, no over-saturated teal-and-orange grade, no
blown-out highlights, no distorted hands, no extra fingers, no morphing faces,
no crowds of identical people, no visible brand names on clothing or products
```

## 6. Putting bridalteam.com on screen

The prompts ask for a phone and a laptop held square to camera and steady —
that is deliberate. **No video model can render a real website**: it will
invent a plausible-looking layout with garbled type and a fake URL, which is
worse than no screen at all. So generate the device as a blank, well-lit,
stable surface and track the real site onto it in post (After Effects' Mocha
tracker, Resolve's Planar Tracker, or a corner-pin in any NLE).

**What to capture, from the live site:**

1. **The address bar.** Screen-record a mobile browser: tap the bar, type
   `bridalteam.com`, hit go. Capture the real autocomplete and the page paint —
   that beat is what the shot is for, so let it breathe for a full second.
2. **The homepage hero.** The orange wash over the hero photograph, the
   *Now with an AI planning team* pill with its pulsing dot, the uppercase
   **FUN, SIMPLE / WEDDING PLANNING.** headline, the white **Try the AI
   planner** button, and the `100% / 1 place / 24/7` stat row. The hero
   background has a slow zoom (`animate-slow-zoom`) and the headline fades up —
   record long enough to catch both.
3. **The planner actually answering.** Go to `/planner` and ask something real
   — *"We have $28k and 9 months, what do we book first?"* — and let the reply
   stream. Don't fake it; the streaming cadence is the most convincing thing in
   the film. Set `ANTHROPIC_API_KEY` for a live answer, or use demo mode, which
   reads the question and replies in context either way.
4. **The scroll.** One slow pass down the homepage through the four pillars and
   the alternating highlight sections, so there's B-roll for the montage.

**Capture notes.** Record at device resolution or above (a 1290×2796 iPhone
capture holds up when corner-pinned into a 4K frame), hide notification
banners and the battery-saver tint, and turn off dark mode. Grab a second pass
at half scroll speed — it's easier to speed a capture up than to smooth a fast
one. Keep a clean plate of each device screen (blank, screen on, same lighting)
as a tracking backup.

**In the composite:** add the screen's own glow spill back onto the faces and
fingers, a touch of motion blur matched to the handheld drift, and a glass
reflection at about 5–8% so the screen sits in the room rather than floating on
top of it.

**Which URL to show.** Always the bare `bridalteam.com` — the canonical host
(`lib/site.ts`; `bridalteam.net` 301s to it). No `www.`, no UTM parameters, no
deep link in the address bar.

## 7. Assembly notes

- **Generate the end card in post, never in the model.** Every generator
  garbles type and wordmarks. Land the last shot clean and composite the logo,
  the URL and the call to action over it.
- **Match grade across clips.** Generated shots drift; a single warm LUT and a
  consistent white balance pass is what makes six separate generations read as
  one film.
- **Composite the real site; never let the model draw it.** See the section
  below — this is the one step that decides whether the film looks like the
  product or like a generic ad.
- **Cast realistically.** Mixed ages and backgrounds, ordinary clothes, one
  scene that's clearly a small backyard or a courtyard rather than a venue.
  The brand is "fun and simple", not aspirational luxury.
- **Aspect ratios.** 16:9 for the site hero and YouTube, 9:16 for social, 1:1
  crop for the feed. Frame the 16:9 shots with headroom so the vertical crop
  survives.
- **Music rights.** Generated audio beds vary in licensing; for anything paid,
  replace the model's score with a licensed track before it runs.
