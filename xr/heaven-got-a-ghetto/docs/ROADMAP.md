# Roadmap

The sequencing here exists to solve one problem: **the rights conversation goes better when
you have something to put on someone's head.** Everything is ordered so that the Tupac
licence is the last dependency, not the first.

---

## Phase 0 — Clearance search (start now, runs in parallel with everything)

Before any production spend, pay a music clearance attorney or clearance house for a search
on the track:

- Who controls the master today?
- Who are the writers, what are the splits, who administers each?
- What is sampled or interpolated, and who controls those?
- Has the estate licensed comparable interactive work before, and through whom?

This is bounded, affordable, and turns the project's largest unknown into a known. It is
the single best first dollar. It does not block Phase 1 — run them together.

**Output:** a one-page memo naming every party you would have to convince.

---

## Phase 1 — Prototype · 6–10 weeks part-time · you, or you plus one dev

Build the mechanic. Prove the idea. Use music you already control or can licence for a few
hundred dollars — a local artist will often say yes to a portfolio piece for a credit, and
will be pleased you asked.

- [ ] Unity 6 project opens and compiles (this scaffolding has never seen a compiler)
- [ ] Grey-box block: street corner, stoop, fence, parked car. Boxes and one texture.
- [ ] Six stems of the placeholder track loading and starting phase-locked
- [ ] `ProximityStemZone` tuned by hand until walking the room feels right
- [ ] Chapters 2 and 5 running — the same geometry, two lightings
- [ ] Deploys to a Quest 3 and holds 72fps
- [ ] Ten people who are not you have worn it

That last item is the actual deliverable. Everything before it is setup.

**Gate:** do strangers take the headset off and want to talk about it? If not, fix that
before spending anything. No licence rescues a mechanic that does not land.

---

## Phase 2 — Vertical slice · 3–4 months · 3–4 people

One chapter at real production quality. Chapter 2 (The Block) is the right choice: it
carries the mechanic, and its assets are reused wholesale by Chapter 5, so the work is
never thrown away.

- [ ] Environment built for real — Gaussian splat capture of a real location, or modelled
      and lit by hand. Decide which by testing a splat on-device early; the performance
      answer drives the art direction, not the other way round.
- [ ] Audio implementation on a proper spatialiser (Meta XR Audio SDK or Steam Audio)
- [ ] AR passthrough bookends (Chapters 1 and 6) — needs the plane-anchoring work listed
      under Known Gaps in ARCHITECTURE.md
- [ ] Comfort pass with people who are prone to motion sickness, not just people who aren't
- [ ] Haptics on the low band
- [ ] Credits panel rendering `TrackManifest.rightsNote`

**Gate:** this is what you show the estate. It should be good enough that its quality is
not the reason for a no.

---

## Phase 3 — The ask

With the Phase 2 build and the Phase 0 memo, approach the rights holders through your
clearance attorney. Bring:

- A headset with the slice on it, and someone to run it
- A written statement of intent — what the piece is, what it is not, and explicitly that it
  does not depict him
- A specific, bounded ask: which track, what distribution, what territory, what term
- A revenue model, or an honest statement that there isn't one

**Plan for a no.** The architecture keeps the track as data — a different `TrackManifest`,
retimed chapters, no code changes — so a refusal costs you the edit and not the work. If it
is a no, you still have a finished piece and you find another song, possibly with an artist
who will collaborate rather than licence.

---

## Phase 4 — Full production · 9–18 months · 5–10 people

Only with rights secured, or with a substitute track chosen.

All six chapters. Both modes. Festival and store submission. Accessibility passes: a seated
version, a version that does not require walking, subtitles, and a colourblind-safe palette
for the light-driven moments.

---

## Rough money, excluding licensing

| Phase | Cost |
|---|---|
| 0 — Clearance search | Low four figures |
| 1 — Prototype | Your time, plus a small track licence |
| 2 — Vertical slice | Tens of thousands if you are paying people |
| 4 — Full production | High six figures and up with volumetric capture and original art |

Licensing itself is genuinely unknowable in advance — from "no, and no number changes that"
to a five- or six-figure fee plus points. Which is the entire reason Phases 1 and 2 come
first.

---

## The one-sentence version

Build the whole thing on a track you can clear, get it to the point where strangers take
the headset off and want to talk about it, and only then go ask for the Tupac record —
because that is the only version of the conversation where the answer might be yes.
