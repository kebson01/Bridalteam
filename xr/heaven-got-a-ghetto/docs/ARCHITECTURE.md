# Architecture

The whole system is an answer to one question: **where are we in the song, and what should
be true because of that?**

```
                    MusicClock
              (AudioSettings.dspTime)
                         |
        +----------------+----------------+
        |                |                |
  StemMixer      ExperienceDirector   AudioReactive
        |                |                |
   SpatialStem       Chapter          visuals
        |         (ScriptableObject)
 ProximityStemZone       |
        |            stage roots
    the listener      on/off
```

---

## Song time is the only timeline

Nothing in this project is driven by `Time.time`, frame counts, coroutine chains or
animation state machines running free. Every timed thing reads `MusicClock.SongTime`.

`MusicClock` derives that from `AudioSettings.dspTime`, the clock the audio thread itself
schedules against — not from `AudioSource.time`, which is quantised to the audio buffer and
jitters by several milliseconds frame to frame. That jitter is invisible on a progress bar
and extremely visible the moment you strobe a light or cut a camera on it.

The practical payoff: if a frame hitches, or the headset drops 300ms re-acquiring tracking,
or the listener's guardian boundary interrupts — the experience resumes at wherever the
record actually is, not wherever a coroutine had got to. On a four-minute piece with cuts
on downbeats, this is the difference between tight and broken.

`MusicClock` also emits `Beat` and `Bar` events, and it **catches up rather than skips**: if
one frame spans two beats, both fire. A swallowed downbeat is a visible mistake.

---

## Stems start together or not at all

`StemMixer` books every stem with `PlayScheduled` against a **single** future `dspTime`,
half a second out.

Calling `Play()` on eight `AudioSource`s in a `foreach` starts them on eight different audio
buffers. That is an audible flam on headphones, and it does not stay constant — it drifts
over the length of the track. One booked timestamp keeps them sample-aligned for the whole
piece. This is the single most important audio detail in the project.

The same timestamp is handed to `MusicClock.BeginAt`, so the clock and the audio share an
origin by construction rather than by hoping.

---

## Silent preview mode

If the audio files are absent, `StemMixer` logs a warning and starts the clock anyway.
Chapters run, stages swap, `AudioReactive` components bound to `BeatPulse` still animate.

This is a rights feature as much as a convenience one. It means an artist, a designer or a
reviewer who does not hold the recording can still open the project, walk the chapters and
do useful work. Given that the audio is the one asset that may never be clearable, the
project should not be dead in the water without it.

---

## The mechanic: `ProximityStemZone`

The reason the project exists.

Each zone owns a `StemRole` and a position. Every frame it measures the distance from the
`AudioListener` — not `Camera.main`, because in an XR rig those can be different transforms
and it is the listener's position that determines what a person actually hears — and
computes a focus value between the inner and outer radius.

At full focus its own stem goes to `focusedLevel` and **every other stem ducks to
`duckOthersTo`, which defaults to 0.45 rather than 0.** The record must never fall apart. It
should lean. A listener who walks into a corner and finds silence thinks it is broken; a
listener who walks into a corner and finds the drums enormous and everything else distant
thinks it is magic.

Response time is ~0.35s. Faster reads as a glitch, slower breaks the sense that your own
body is doing it.

Zones only act during `Agency.Roam` chapters, so a seated listener drifting on their
tracking during a static moment does not get an unexplained mix change.

---

## Chapters are data

`Chapter` and `ChapterSequence` are `ScriptableObject`s. The edit — timings, staging,
agency, mix cues — is authored in the inspector and changeable without a recompile.

This matters more here than on a typical project. The edit will be re-cut many times
against the actual record, by whoever is directing rather than whoever is programming, and
every revision that needs a programmer is a revision that quietly does not happen.

`ExperienceDirector` polls `sequence.IndexAt(songTime)` and, on a change, closes the
outgoing stage, opens the incoming one, applies the chapter's stem cues and publishes
`CurrentAgency`. Gaps in the edit are legal and produce no active chapter.

`ChapterSequenceValidator` (Ghetto menu) catches overlaps, gaps, inverted times, missing
stage roots and an edit that runs past the end of the track. All of those are otherwise
found by building to a headset, which costs minutes each time.

---

## One build, three presentations

`XRModeBootstrapper` resolves `Screen`, `ImmersiveVR` or `PassthroughAR` at boot by asking
the running `XRDisplaySubsystem` whether the display is opaque, then activating the right
rig and the right environment set.

Maintaining separate AR and VR projects doubles the authoring cost of every chapter and
guarantees the two drift apart. The cost of the single-build approach is a real art
constraint: **every stage has to survive having its skybox and floor taken away.** That
needs to be understood at the start, not discovered when the AR build looks wrong.

The treatment uses this deliberately — AR bookends, VR middle — rather than treating AR as
a downgrade.

---

## Visuals bind to audio through one small component

`AudioReactive` maps one audio value (a spectrum band, a stem's level, a beat pulse) to one
visual property (scale, light intensity, a shader float), with remap, exponent and
smoothing.

Deliberately unambitious. The temptation on a project like this is a node graph; what
actually ships is fifty of these on fifty objects, each tuned by hand, because "is this on
the beat" is a judgement no parameter surface makes for you.

It writes through `MaterialPropertyBlock` rather than `renderer.material`, because touching
`.material` instantiates a per-object copy and breaks SRP batching — which on standalone is
the difference between holding 72fps and not.

`SpectrumAnalyzer` bands are spaced roughly logarithmically and weighted by bin index. An
even split of a 22kHz FFT puts nearly every band above where a hip hop record lives, and
the visuals sit dead while the track is obviously moving. Bands also normalise against a
decaying running peak so quiet passages still drive something.

---

## Comfort is a system, not a polish task

`ComfortVignette` reads `Chapter.vignette` and closes the aperture to ~0.62 during induced
motion. Any chapter that moves the listener without their input must set that flag.

It is in the architecture rather than the art pass because retrofitting comfort late means
either shipping something that makes people ill or cutting the moments that caused it.

---

## Known gaps

Written but not yet built:

- **AR anchoring.** Placing content against detected planes in passthrough — needs an
  `ARPlaneManager` pass and a placement reticle for Chapters 1 and 6.
- **Haptics.** `SpectrumAnalyzer.Low` should drive controller haptics on the downbeat.
  Roughly twenty lines against the XR Interaction Toolkit haptic API.
- **Credits panel.** `TrackManifest.rightsNote` is authored and stored but nothing renders
  it yet. Chapter 6 needs it.
- **Scene assets.** There are no `.unity` scene files, prefabs, materials or art in this
  repo — only the runtime systems those things will hang off.
- **Compilation.** None of this has been through the Unity compiler. See the README.
