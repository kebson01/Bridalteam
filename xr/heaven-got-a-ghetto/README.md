# I Wonder If Heaven Got a Ghetto — XR

An interactive AR/VR music experience built in Unity. The listener does not watch the
song. They stand inside it, and the record re-mixes itself around their body as they move.

**This directory is a self-contained project.** It currently lives inside the `Bridalteam`
repo only because the session that created it could not create a new GitHub repo (see
[Getting this into its own repo](#getting-this-into-its-own-repo)). Nothing here depends
on anything else in `Bridalteam`.

---

## Short answer: is this a pipe dream?

**No. The technology is not the hard part, and none of it is speculative.** Everything the
experience needs shipped years ago and runs on a $300 headset:

| What you asked for | How it's done today | Maturity |
|---|---|---|
| Put on a headset and be inside the song | Unity 6 + OpenXR, one build for Quest 3/3S and Vision Pro | Routine |
| Same thing in AR, in your own room | AR Foundation passthrough; the room becomes the set | Routine |
| Feel the song around you, not in front of you | Spatialized stems + head-tracked audio | Routine |
| Walk toward the drums and hear the drums | `ProximityStemZone` in this repo | Built here |
| Photoreal recreation of a real place | Gaussian splatting from photos/video | New but production-ready |
| A performer present in the room with you | Volumetric capture (Depthkit, 4DViews) | Mature, expensive |

I have written the core runtime for this — the music clock, the stem mixer, the spatial
zone mechanic, the chapter director, the AR/VR mode switch. It is in `unity/Assets/Ghetto/`.

**The hard part is rights, and it is genuinely hard.** Read
[docs/RIGHTS.md](docs/RIGHTS.md) before you spend a dollar or a weekend on this. The
summary: you need four separate permissions, from at least three different parties, and
one of them is Tupac's estate. That is not a reason to stop. It is a reason to sequence
the work so the rights conversation happens when you have something to show.

The recommended sequence is in [docs/ROADMAP.md](docs/ROADMAP.md). It is, in one line:
**build the whole thing on music you already control, prove the mechanic works, then take
a working headset demo to the estate.** Nobody licenses Tupac to a pitch deck.

Full reasoning: [docs/FEASIBILITY.md](docs/FEASIBILITY.md).
Creative treatment: [docs/TREATMENT.md](docs/TREATMENT.md).

---

## What's actually in here

```
unity/Assets/Ghetto/
  Runtime/
    Core/
      MusicClock.cs           Sample-accurate song time. The spine.
      Chapter.cs              One movement of the piece, as data.
      ChapterSequence.cs      The edit.
      ExperienceDirector.cs   Runs the edit against the clock.
      XRModeBootstrapper.cs   One build -> flat screen, VR, or passthrough AR.
    Audio/
      TrackManifest.cs        Declares the stems. Holds the rights note.
      StemMixer.cs            Loads stems, starts them phase-locked.
      SpatialStem.cs          One stem, positioned in the room.
      SpectrumAnalyzer.cs     Audio -> numbers the visuals can use.
    Interaction/
      ProximityStemZone.cs    THE mechanic. Walk toward a stem, it takes the mix.
      GazeDwellTrigger.cs     Look-and-hold input. No controllers required.
    Presentation/
      AudioReactive.cs        Bind any audio value to any visual property.
      ComfortVignette.cs      Motion sickness mitigation. Not optional.
  Editor/
    ChapterSequenceValidator.cs   Catches edit mistakes without a headset build.
```

**Status: written, not yet compiled.** This scaffolding was authored in a container with
no Unity install, so it has never been through the compiler. Expect a first pass of small
fixes — a missing `using`, an API that moved between package versions — when you first
open it. The logic and architecture are the deliverable; treat the syntax as a first draft.

---

## Running it

1. Install **Unity 6000.0 LTS** with Android Build Support (for Quest).
2. Open `unity/` as a project. Let it resolve packages.
3. Open the scene, press Play.

It runs with **no audio present**. `StemMixer` falls back to silent preview mode and the
clock, chapters and staging all still work. This is deliberate: it means people who do not
hold the recording can still build, review and test the experience. See
`unity/Assets/StreamingAssets/Track/README.md`.

To hear it, drop your own licensed audio files into
`unity/Assets/StreamingAssets/Track/` and name them in the `TrackManifest` asset. Those
files are gitignored and must never be committed.

---

## Getting this into its own repo

The session that built this was scoped to `kebson01/Bridalteam` and could not create a new
repository. To split it out with its history intact:

```bash
# 1. Create an empty repo on GitHub named heaven-got-a-ghetto (no README, no .gitignore)

# 2. From a clone of Bridalteam:
./xr/heaven-got-a-ghetto/scripts/extract-to-standalone-repo.sh git@github.com:kebson01/heaven-got-a-ghetto.git
```

Then delete `xr/` from `Bridalteam`. The script is a `git subtree split`, so the commits
that touched this directory carry over and nothing else does.

---

## A note on what this is for

The pitch is not "a music video you can look around in". Three-sixty video already exists
and it is not very interesting, because looking around is not the same as being somewhere.

The pitch is that **the mix becomes a place**. The drums are over there. The voice is behind
you. Walking changes what you hear, so two people in the same room at the same moment are
hearing different records, and neither of them is hearing the one that was mastered. That
is a thing you cannot do on any other medium, and it is worth the trouble.

For this song specifically, the mechanic has a point beyond novelty. The record is a man
asking whether there is any peace waiting for people like him. Building it as a place the
listener has to walk through — the same block rendered twice, once as life and once as
whatever comes after — makes the listener answer the question with their feet.
