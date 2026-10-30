# Pinterest pins: batch <N>, <theme> (<YYYY-MM-DD>)

<One or two sentences: which pages, and why these.> **Nothing here is
posted.** The owner reviews the pins before they go up.

Every line on a pin is quoted or condensed from the page it links to
(<source file>). <Note any caution kept, or any detail left out on purpose.>

## Before posting

- **Images:** the finished 1000 × 1500 PNGs are in `<YYYY-MM-DD>-batch-<N>/`.
- **Boards:** <confirm they exist, or name the new board, with its proposed
  description>.
- **Links:** use each tagged URL exactly as written (`utm_source=pinterest`).
- **Timing:** one a day, after <the last queued batch> ends on <date>.

---

## Pin 1: <short name>

- **Board:** <board>
- **Title:** <at most 100 characters>
- **Description:**
  <At most 800 characters, condensed from the source. Use plain sentences, or
  a short list when the pin itself is a list.>
- **Alt text:** <What the image shows, in words.>
- **Link:**
  `https://bridalteam.com/<path>?utm_source=pinterest&utm_medium=social&utm_content=<unique-slug>`
- **Image:** `01-<slug>.png`
- **Photo:** <photo page URL>, by <photographer>, <license>. *(Photo pins only.)*

<Repeat for pins 2–5.>

---

## After posting

For each pin, add a row under **Posts** in `COUPLES-TRACKER.md` with:
- the date;
- the pin URL;
- the `utm_content` value;
- the status `posted`.

After 7 days, record that page's visits from `source = 'pinterest'`.
