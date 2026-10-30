# Photos for pins and stories

Photo pins outperform plain text on Pinterest, but every photo must be one
Bridal Team is allowed to use commercially.

## Where photos may come from

| Source | OK? | Notes |
|---|---|---|
| **Pexels** (pexels.com) | Yes | Free for commercial use, no attribution required. The site's inspiration gallery already uses Pexels photos (`lib/inspiration.ts`). Don't sell unaltered copies, and don't imply anyone pictured endorses Bridal Team. |
| **Unsplash** (unsplash.com) | Yes, free photos only | See "Unsplash" below. |
| **The owner's own photos** | Yes | Ask the owner first. |
| **A vendor's photos** | Only with written permission | Even when the vendor has claimed a listing. Record the permission in the batch notes. |
| **`public/brand/*.jpg`** | Previews only | Small site banners with no recorded source, too low-resolution for a full pin. |
| **Google Images, Instagram, Pinterest, vendor websites** | No | Not licensed. |
| **AI-generated "real wedding" photos** | No | Misleading. |

## Unsplash

These are the terms of the Unsplash License as understood on 2026-10-29. The
sandbox couldn't load unsplash.com/license to re-check them, so re-read that
page once the host is allowed.

- **Allowed:** commercial and non-commercial use, with no permission needed,
  including edits such as cropping and putting text over the photo. A pin is
  fine.
- **Attribution:** not required, but appreciated. The batch notes record it
  anyway, as "Photo by <name> on Unsplash".
- **Not allowed:**
  - selling a photo without significantly changing it;
  - collecting Unsplash photos to build a similar or competing photo service.
    A handful of pins is fine; a gallery of Unsplash photos on the site would
    not be.
- **Unsplash+ photos** (marked "Unsplash+" or served from `plus.unsplash.com`)
  are paid, and the free license doesn't cover them. Skip them.
- **No releases:** the license includes no model or property releases. Don't
  imply that anyone pictured, or any brand shown, uses or endorses Bridal
  Team, and don't name venues or vendors you can't identify for certain.
- **"Ideas" from photos:** colors, styling, florals and table design are fair
  game for original palette pins and copy. Describe what you see, without
  claiming it's a specific real wedding.

**Downloading:** use the photo's download link, or
`https://images.unsplash.com/photo-<id>?w=1600&q=85`, and keep the photo page
URL for the credit. Searching on unsplash.com and downloading from
images.unsplash.com both need those hosts allowed in the environment's network
settings. api.unsplash.com also needs an access key.
unsplash.com sits behind a bot check that blocks `curl`, so don't script
searches against it. Find photos with web search and a page fetch of the photo
page instead (it shows the `images.unsplash.com/photo-<id>` URL, the
photographer, and whether it's Unsplash+), then download from
images.unsplash.com.

**No identifiable faces (the owner's rule, 2026-10-30).** Don't use any photo
where a person's face can be recognized, even small or in the background.
Hands, a bouquet held at the waist, or people seen from behind or blurred
past recognition are fine. Use details, venues, flowers, tables and gear.
Check each photo at full size before you use it, not just the thumbnail.

## Getting a photo onto the machine

The renderer only reads local files; it never fetches from the network.
1. Download each photo into the batch's scratch folder with `curl`, which uses
   the environment's proxy. For Pexels, ask for a large size:

   ```
   curl -sSL -o <scratch>/photos/venue.jpg \
     "https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&cs=tinysrgb&w=1600"
   ```

2. If the download fails with a proxy refusal, the environment's network
   policy blocks the host. Tell the user to add the hosts under Allowed
   domains in the cloud environment's network settings:
   - `images.pexels.com` and `www.pexels.com` for Pexels;
   - `unsplash.com` and `images.unsplash.com` for Unsplash. Don't substitute an unlicensed photo.
3. **Check the size.** Use at least 1000 × 1500 px for `photoFull` and at
   least 1000 px wide for `photoTop`. A smaller image looks soft once
   stretched.

Photos stay in scratch. Only the rendered PNGs are committed.

## Recording credit

For each photo pin, the batch notes list:
- the photo's page URL;
- the photographer;
- the license (for example "Pexels license").

Attribution isn't required, but this is how anyone can later check where an
image came from.
