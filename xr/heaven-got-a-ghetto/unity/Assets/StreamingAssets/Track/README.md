# Track audio goes here — and is never committed

Drop your stem files in this directory and name them in the `TrackManifest` asset.
`StemMixer` streams them from here at runtime.

**Nothing in here is committed to git.** The project `.gitignore` blocks `*.wav`, `*.ogg`,
`*.mp3`, `*.flac`, `*.m4a` and `*.meta` in this directory. Do not override that. See
`docs/RIGHTS.md` for why this matters.

## Expected layout

Whatever you name them, as long as the `TrackManifest` agrees. A reasonable convention:

```
bed.ogg          full mixdown, quiet, 2D    - so the record never disappears
vocal.ogg        lead vocal
rhythm.ogg       drums and percussion
bass.ogg         bass / 808
harmony.ogg      keys, strings, samples
chorus.ogg       backing vocals, ad libs
```

`.ogg` is the right default: it decodes cheaply enough to stream six or eight at once on a
standalone headset, and the size difference against `.wav` matters when the whole build has
to fit in a headset's storage.

## Running with no audio

The experience runs fine with this directory empty. `StemMixer` logs a warning and starts
in silent preview mode: the clock runs, chapters fire, staging swaps, and anything bound to
`BeatPulse` still animates.

That is intentional. It means people who do not hold the recording can still open the
project and do useful work.
