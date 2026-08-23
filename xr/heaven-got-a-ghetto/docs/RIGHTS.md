# Rights

**Read this first.** The technical work in this repo is the easy half. This document is
the hard half, and getting it wrong is the difference between a project and a lawsuit.

Nothing here is legal advice. It is a map of what you will need to ask a music clearance
lawyer, so that when you do, you are asking good questions.

---

## You need four separate permissions, not one

People new to music licensing assume there is "a licence for the song". There is not.
Every one of the following is a distinct right, owned by a distinct party, and any one of
them can kill the project on its own.

### 1. The composition — a **synchronisation licence**

The song as written: melody, lyrics, structure. Owned by the songwriters and administered
by their music publishers. There are usually several writers on a hip hop record, and on
this one there are almost certainly co-writers and producers with splits. **Every single
one of them has to say yes.** A 5% writer can block the whole thing.

You need a sync licence because you are timing the composition to moving images. That is
what "sync" means, and an interactive scene absolutely counts.

### 2. The recording — a **master use licence**

The specific 1997 recording. Owned by whoever controls the master, which for most of
Tupac's catalogue means the estate (Amaru Entertainment) together with the label side of
the Death Row / Interscope / Universal chain. Ownership of specific posthumous releases has
moved around over the years, including through the Death Row catalogue sale. **Do not
assume you know who controls this one — a clearance search is a real, paid piece of work
and it is the correct first spend on this project.**

Sync and master are negotiated separately, often with different lawyers, and either side
can say no independently of the other.

### 3. Any samples inside the recording

Nineties hip hop records are built out of other records. If this track contains a sample or
an interpolation, that sample carries its own composition and master rights, and you have
to clear those too — through the same two-sided process, with two more sets of owners.

I am not going to assert from memory what is or is not sampled here. **Assume there is at
least one uncleared-for-your-purposes sample until a clearance search proves otherwise.**
That is the safe default for any record from this era, and being wrong in the other
direction is expensive.

### 4. Tupac's likeness and persona — **right of publicity**

This one is completely independent of the music, and people forget it constantly.

If your experience depicts Tupac — a volumetric capture, a modelled avatar, an
AI-generated likeness, his voice outside the record itself, even a strongly suggestive
silhouette — that is his estate's right to control, and it survives him. The estate has
historically been protective of it and selective about approvals. The 2012 Coachella
projection is the reference point for what an approved use looks like: it happened, and it
happened because the estate was involved from the start.

**Design decision that follows from this:** the treatment in
[TREATMENT.md](TREATMENT.md) deliberately does not depict him. The experience is built
around absence — his voice in a place he is not standing. That is a stronger creative
choice anyway, and it removes an entire category of legal risk. If the estate later wants
a figure in it, that is a happy addition, not a dependency.

### And a fifth, if you touch the music video

The 1997 music video is **a separate copyrighted audiovisual work** from both the song and
the recording, typically controlled by the label. You cannot cut its footage into your
experience without licensing it.

Recreating its shot language in original 3D work is a much safer path, but "safer" is not
"safe": a close, recognisable, shot-for-shot reconstruction can still be a derivative work.
Take it as visual reference and inspiration, build your own imagery, and have counsel look
at the result.

---

## Stems: a problem you will hit in week two

The core mechanic in this repo — walk toward the drums, the drums take over the mix — needs
the track as **separated stems**, not as a stereo mixdown. Only the rights holder has the
multitrack.

The obvious workaround is AI source separation (Demucs and similar) run on the commercial
release. It works better than most people expect. Two warnings:

- **Quality.** Separated stems have artifacts — smeared transients, bleed, a hollow quality
  when you solo them. Fine at a normal listening distance in a full mix. Much more exposed
  when a listener walks up to a single stem and puts their head next to it, which is exactly
  what this experience invites them to do.
- **Legality.** Running separation on a copyrighted master produces a derivative work. Doing
  it privately, on a machine in your house, to prototype something is one thing. Shipping
  it, exhibiting it, or putting it on a festival floor is another thing entirely, and it is
  not defensible.

**Position this repo takes:** stems are supplied by you, locally, and are never committed.
`.gitignore` blocks every common audio extension inside `StreamingAssets/Track/`.
`TrackManifest` carries a `clearedForDistribution` flag that defaults to **false** and a
free-text `rightsNote` that is displayed in the experience's own credits panel. The
architecture is built so that the question "are we allowed to show this to anyone" has an
answer stored in the project rather than in someone's memory.

---

## The realistic path

The estate does licence things. There is an official Tupac museum experience, there was the
Coachella projection, there was a studio biopic. This is not a closed door. But those all
happened with the estate as a partner from early on, not as a permissions box ticked late.

So:

1. **Do not build this on the Tupac track first.** Build the entire experience — every
   mechanic, the full chapter structure, the whole treatment — on music you own outright or
   have licensed cheaply. A local artist will often licence a track to a portfolio piece for
   a few hundred dollars and a credit, and will be glad you asked.
2. **Get it working in a headset.** A person putting on a Quest and walking through your
   mix for four minutes is worth more than any deck.
3. **Then approach the estate**, through a music clearance lawyer, with that demo, a written
   statement of intent, and a specific ask. Show them something respectful that already
   exists. The conversation is completely different when the answer to "what would this look
   like" is "here, put this on".
4. **Budget for a no.** Design the piece so that swapping the track is a data change — a
   different `TrackManifest`, retimed chapters — and not a rewrite. The code in this repo is
   built that way on purpose. If the answer is no, you still have a finished work and you
   find another song.

The one thing not to do is build it on the Tupac master in secret and hope. That path ends
with a takedown at best, and at worst with a piece of work you are proud of that you can
never show anybody.

---

## Before you spend money

Talk to a **music clearance attorney or a clearance house** before the first real
production dollar. Not a general lawyer. This is a specialist trade with specialist
relationships, and a clearance search on this track — who actually controls the master now,
which publishers are on the composition, what is sampled — is a bounded, affordable,
concrete piece of work that turns the biggest unknown in the project into a known.

Do that search early. It is the cheapest risk reduction available to you.
