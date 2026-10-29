# Photos for pins and stories

Photo pins outperform plain text on Pinterest, but every photo must be one
Bridal Team is allowed to use commercially.

## Where photos may come from

| Source | OK? | Notes |
|---|---|---|
| **Pexels** (pexels.com) | Yes | Free for commercial use, no attribution required. The site's inspiration gallery already uses Pexels photos (`lib/inspiration.ts`). Don't sell unaltered copies, and don't imply anyone pictured endorses Bridal Team. |
| **Unsplash** (unsplash.com) | Yes | Same terms in practice. |
| **The owner's own photos** | Yes | Ask the owner first. |
| **A vendor's photos** | Only with written permission | Even when the vendor has claimed a listing. Record the permission in the batch notes. |
| **`public/brand/*.jpg`** | Previews only | Small site banners with no recorded source, too low-resolution for a full pin. |
| **Google Images, Instagram, Pinterest, vendor websites** | No | Not licensed. |
| **AI-generated "real wedding" photos** | No | Misleading. |

Avoid photos where an identifiable person is the focus of a topic that could
embarrass them, such as costs or etiquette mistakes. Details, venues, flowers
and tables are safest.

## Getting a photo onto the machine

The renderer only reads local files; it never fetches from the network.
1. Download each photo into the batch's scratch folder with `curl`, which uses
   the environment's proxy. For Pexels, ask for a large size:

   ```
   curl -sSL -o <scratch>/photos/venue.jpg \
     "https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&cs=tinysrgb&w=1600"
   ```

2. If the download fails with a proxy refusal, the environment's network
   policy blocks the host. Tell the user to add `images.pexels.com` (and
   `www.pexels.com` for search) under Allowed domains in the cloud
   environment's network settings. Don't substitute an unlicensed photo.
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
