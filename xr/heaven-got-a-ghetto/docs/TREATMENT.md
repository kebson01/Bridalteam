# Treatment

A six-chapter structure for the experience. Times are placeholders against a ~4:30 track
and will be re-cut against the real recording; they exist so the `ChapterSequence` asset
has something to hold and so the engineering has a shape to build against.

**Design rule running through all of it: he is never depicted.** The listener is in the
places the record describes, with his voice present and his body absent. This is a
stronger creative choice than a hologram and it removes the entire likeness-rights problem
described in [RIGHTS.md](RIGHTS.md).

**Second design rule: the mix is the map.** Where a stem sits in space is a statement about
what it means. The drums are the street. The voice is the only thing that follows you.

---

## Chapter 1 — Arrival · 0:00–0:22 · `Observe` · **AR**

The experience opens in **passthrough**. The listener's own room, their own furniture,
their own light. No content. Just a low sub-bass that seems to come from the floor.

A single point of warm light appears at the far end of whatever room they are actually
standing in, and the room's edges begin to darken — not a cut, a bleed. Their walls
desaturate toward concrete over about fifteen seconds.

*Why:* starting in the listener's real room, and taking it from them slowly, does something
no fade-from-black can. The place you end up matters more when you watched your own living
room become it.

Mix: `Bed` only, 2D, quiet.

---

## Chapter 2 — The Block · 0:22–1:30 · `Roam` · **VR**

The room is gone. The listener is on a street corner at dusk. Warm, low, orange. Parked
cars, a stoop, a chain-link fence, a corner store sign. Quiet, and populated only by
implication — a television flickering behind a curtain, a silhouette crossing a doorway
upstairs, a dog somewhere.

**This is where the core mechanic turns on.** The stems are distributed across the block:

| Stem | Where it lives | What it means |
|---|---|---|
| `Rhythm` | A car parked across the street, windows up, bass audible through glass | The pulse of the place |
| `Bass` | The ground itself, omnidirectional | Felt, not heard |
| `Harmony` | An open second-floor window | Someone else's music |
| `Chorus` | A ring at the edges of the block | The neighbourhood answering |
| `Vocal` | Follows the listener at a fixed distance behind their shoulder | He is with you, not in front of you |

The listener can walk. Walking toward the car brings the drums up and pushes everything
else back. Standing in the middle of the intersection gives them the record roughly as it
was mastered. This is the moment the piece justifies itself: they will realise the song is
a place, and they will start exploring it.

*Duration is deliberate.* A full minute of unhurried roaming before anything happens. Let
them find it themselves.

---

## Chapter 3 — The Turn · 1:30–2:05 · `Observe` · **VR** · vignette on

Something happens off-screen. It is never shown.

The light goes from dusk to sodium-orange in a single frame on a downbeat. Every window on
the block goes dark in sequence. The `Chorus` stem — the neighbourhood — cuts out
completely and does not come back. The car's engine starts and it drives away, taking the
`Rhythm` stem with it, physically, audibly, into the distance.

The listener is left standing in the intersection with the bass, the bed, and his voice.

*Why nothing is depicted:* the record does not need illustrating and any depiction of
violence here would be both cheap and unnecessary. Removing things from the mix is more
frightening than adding anything to the picture. The listener's own imagination does the
work, and it will do it better than any art team.

Locomotion is disabled and the vignette closes, because the world is about to move.

---

## Chapter 4 — The Question · 2:05–2:50 · `Gaze` · **VR**

The ground goes. Not a fall — the block simply recedes below the listener, slowly, while
they stay level. The street becomes a grid of lights, then a texture, then nothing.

They are in open dark with his voice and the bed. Around them, out of reach, are points of
warm light at varying distances. Looking at one and holding — `GazeDwellTrigger`, no
controllers — brings a fragment of the block back for a few seconds: a stoop, a doorway, a
window with its light on. Look away and it dissolves.

The title question of the record gets asked here. The listener answers it by choosing what
they reach for.

*Comfort note:* the descent is slow, constant-velocity, and vignetted. Constant velocity
matters more than speed — acceleration is what makes people sick.

---

## Chapter 5 — Heaven's Ghetto · 2:50–4:00 · `Roam` · **VR**

The listener arrives, standing, on **the same block**. Identical geometry. Every model
reused, down to the fence.

But the light is dawn instead of dusk, and it comes from everywhere with no visible source.
The windows are all lit. The chain-link throws no shadow. The corner store sign is on. All
the stems are present, all at full, distributed as they were in Chapter 2 — but the
`Chorus` stem, the neighbourhood that vanished in Chapter 3, is back and louder than it
ever was.

The listener can walk again. It is the same walk. It sounds completely different.

*This is the thesis of the whole piece.* He is not asking whether heaven exists. He is
asking whether heaven, for someone from where he is from, looks like anything other than
where he is from — and whether that is a tragedy or a mercy. Building it as literally the
same geometry lets the listener sit inside that question instead of being told it.

Reusing the Chapter 2 environment wholesale is also, conveniently, the single largest
saving in the production budget.

---

## Chapter 6 — Return · 4:00–end · `Observe` · **AR**

The block fades. Passthrough returns — their room, their furniture, their light, exactly as
it was in Chapter 1.

The record ends. Silence, held longer than is comfortable.

Then a single line of text at a readable distance: the track, the writers, the performer,
and the rights note stored in the `TrackManifest`. Then nothing.

*Why end where you started:* the AR bookend makes the whole thing an excursion from their
actual life rather than a self-contained fiction. They take the headset off in the room
they were already in, and the room has not changed, and they have.

---

## Chapter data summary

For direct entry into `ChapterSequence`:

| # | Title | Start | End | Agency | Vignette | Mode |
|---|---|---|---|---|---|---|
| 1 | Arrival | 0.0 | 22.0 | Observe | no | AR |
| 2 | The Block | 22.0 | 90.0 | Roam | no | VR |
| 3 | The Turn | 90.0 | 125.0 | Observe | **yes** | VR |
| 4 | The Question | 125.0 | 170.0 | Gaze | **yes** | VR |
| 5 | Heaven's Ghetto | 170.0 | 240.0 | Roam | no | VR |
| 6 | Return | 240.0 | 270.0 | Observe | no | AR |

---

## On the original music video

Worth watching as reference for palette, wardrobe and the feel of the locations. **Do not
reconstruct its shots.** It is a separately owned copyrighted work (see RIGHTS.md), and
beyond the legal problem, a shot-for-shot rebuild would waste what this medium is for. A
music video is a sequence of framings chosen for you. This is a place you stand in. Those
are different crafts and the second one does not benefit from imitating the first.
