# Feasibility

**Verdict: buildable now, by a small team, with off-the-shelf tools. The blocker is rights,
not technology.**

You asked whether this can be created right now or whether it is a pipe dream. It is
neither science fiction nor a weekend. Below is what is genuinely solved, what is merely
expensive, and what will actually hurt.

---

## Solved. No research required.

**The headset and the runtime.** Unity 6 with OpenXR targets Quest 3/3S, Quest Pro, Pico,
Vision Pro and SteamVR from one project. AR Foundation adds handheld AR on Android and iOS
from the same codebase. `XRModeBootstrapper.cs` in this repo does the mode switch at boot.

**Passthrough AR.** Quest 3 passthrough is colour, low-latency and good enough to build
around. Your living room becomes the set. This is the mode I would lead with for the
opening and closing of the piece, for reasons in [TREATMENT.md](TREATMENT.md).

**Head-tracked spatial audio.** Unity's built-in spatialiser is adequate; Meta XR Audio SDK
and Steam Audio are better and both are free. Sources positioned in the world, occlusion,
distance falloff, reverb zones — all standard.

**Sample-accurate music sync.** The one genuinely fiddly bit of audio engineering here, and
it is solved in `MusicClock.cs` and `StemMixer.cs`. Everything anchors to
`AudioSettings.dspTime` and stems start via `PlayScheduled` against a single timestamp, so
the visuals cannot drift from the record over four minutes and eight stems do not flam
against each other.

**Hand tracking, gaze input, room-scale walking.** All native to the platform now.
Controllers are optional, which matters: `GazeDwellTrigger.cs` exists because most people
who try this will not know what a trigger button does and should not have to learn during
a song.

---

## Solved, but it costs money

**Photoreal real-world environments — 3D Gaussian splatting.** This is the recent unlock
that makes "recreate a specific place" realistic for a small team. You walk a location with
a camera, run the footage through a splatting pipeline, and get a photoreal,
walk-around-able reconstruction in hours rather than months of modelling. Quality is
genuinely striking. Caveats: splats are heavy, and getting one to run at 72fps on a
standalone Quest takes real optimisation work. Renderers for Unity exist and are improving
quickly.

**A performer present in the room.** Volumetric capture — Depthkit at the affordable end,
4DViews and similar at the studio end. Mature technology, real money, and for this project
it runs straight into the likeness rights in [RIGHTS.md](RIGHTS.md). The treatment avoids
needing it.

**Stylised environment art.** The traditional path: modelled, textured, lit by hand. Slower
and more expensive than splatting for realism, but far more controllable, and it is what
you want for the surreal chapters where photoreal is not the goal anyway.

---

## What will actually hurt

### 1. Rights. See [RIGHTS.md](RIGHTS.md).

Four independent permissions, at least three parties, one of them an estate that is
selective by design. This is the project risk. Everything else is scheduling.

### 2. Stems

The walk-through-the-mix mechanic needs the multitrack. Only the rights holder has it. AI
separation gets you a prototype and nothing more — the artifacts are exposed exactly when
a listener walks up close to a soloed stem, which is the thing this experience is built to
encourage. Discussed in full in RIGHTS.md.

### 3. Performance budget on standalone

A Quest 3 gives you roughly 4ms of GPU time per frame at 72Hz to render two eyes. That is
not a lot. Gaussian splats, volumetric video, dense particle work and eight simultaneous
streaming audio sources all compete for it. Expect to spend a real fraction of the schedule
on optimisation, and expect to cut something visually ambitious because it will not hold
frame rate. Plan for it rather than discovering it in month six.

### 4. Comfort

Any moment where the world moves and the listener did not ask it to is a moment somebody
gets nauseous, and somebody getting nauseous in the second verse means they never hear the
third. `ComfortVignette.cs` is in the repo for this reason and it is not decoration. The
treatment keeps the listener stationary or self-propelled almost throughout, and every
induced-motion moment is flagged in the chapter data.

### 5. Emotional register

The genuinely hard creative problem, and the one no tool solves. This song is a man asking
whether there is any peace waiting for people like him. It would be very easy to build
something that is technically impressive and emotionally cheap — neon particles, a
spinning skybox, a "vibe". Restraint is the whole job. The best moments in this piece will
be the quiet ones, and the biggest risk to the work is not the render budget, it is
sentimentality.

---

## What it would take

Rough, honest, and dependent on how much art you buy:

| Stage | Scope | Time | Team |
|---|---|---|---|
| **Prototype** | Core mechanic, placeholder music, grey-box world, runs on a Quest | 6–10 weeks part-time | You, or you plus a Unity dev |
| **Vertical slice** | One chapter at full production quality, real art, real audio | 3–4 months | 3–4 people |
| **Full piece** | Six chapters, AR and VR, festival-ready | 9–18 months | 5–10 people |

Money, excluding licensing: a prototype is your time. A vertical slice is in the tens of
thousands if you are paying people. A full production with volumetric capture and original
environment art runs into the high six figures and up.

Licensing is a genuine unknown — anywhere from "no, and no amount changes that" to a
five-or-six-figure fee plus points. Which is exactly why the roadmap builds everything else
first.

---

## The honest summary

If you asked me "can I have this by Christmas", the answer is: you can have a working
prototype that makes people say *oh* when they put the headset on, on a track you licensed
for a few hundred dollars, and you can have it well before then.

If you asked me "can I have this, with that specific Tupac record, distributed publicly" —
that is a real project with a real budget and a rights conversation that starts now and may
take a year and may end in no.

Both of those are worth doing. They are just not the same project, and the first one is how
you earn the second.
