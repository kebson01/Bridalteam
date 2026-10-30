#!/usr/bin/env python3
"""Turn Pinterest pins into Facebook feed images (1080 x 1350, JPEG).

  python3 plugins/bridalteam/skills/social-graphics/scripts/facebook-feed.py \
      <out-dir> <posts.json> [batch-number ...]

Run it from the repository root. It reads each marketing/pinterest/*-batch-N.md
(all batches, or only the numbers given), fits each pin onto a 4:5 canvas
without cropping, and writes <batch>-<pin>-<name>.jpg into <out-dir>. It also
writes posts.json with each post's title, description and Facebook-tagged link
(utm_source=facebook, utm_content=fb-<pin slug>), for writing the notes.
"""
import re, os, glob, json, sys
from PIL import Image, ImageFilter
OUT = sys.argv[1]
ONLY = {int(x) for x in sys.argv[3:]}
os.makedirs(OUT, exist_ok=True)
posts = []
for md in sorted(glob.glob("marketing/pinterest/2026-10-*-batch-*.md"), key=lambda p: int(re.search(r"batch-(\d+)", p).group(1))):
    n = int(re.search(r"batch-(\d+)", md).group(1))
    if ONLY and n not in ONLY:
        continue
    imgs = sorted(glob.glob(md[:-3] + "/*.png"))
    text = open(md).read()
    for k, block in enumerate(re.split(r"\n## Pin \d+: ", text)[1:]):
        name = block.split("\n", 1)[0].strip()
        title = re.search(r"- \*\*Title:\*\* (.+)", block).group(1).strip()
        d = re.search(r"- \*\*Description:\*\*\n(.*?)\n- \*\*", block, re.S).group(1)
        desc = "\n".join(l[2:] if l.startswith("  ") else l for l in d.split("\n")).strip()
        # join wrapped lines inside paragraphs/list items
        paras = []
        for para in desc.split("\n\n"):
            items, cur = [], ""
            for l in para.split("\n"):
                if re.match(r"^(\d+\.|-) ", l) and cur:
                    items.append(cur); cur = l
                else:
                    cur = (cur + " " + l.strip()).strip() if cur else l
            items.append(cur)
            paras.append("\n".join(items))
        desc = "\n\n".join(paras)
        link = re.search(r"`(https://bridalteam\.com/[^`]+)`", block).group(1)
        slug = re.search(r"utm_content=([a-z0-9-]+)", link).group(1)
        fb = link.replace("utm_source=pinterest&utm_medium=social", "utm_source=facebook&utm_medium=social").replace("utm_content=" + slug, "utm_content=fb-" + slug)
        m = re.search(r"- \*\*Image:\*\* `([^`]+)`", block)
        src = os.path.join(md[:-3], m.group(1)) if m else imgs[k]
        out = f"{OUT}/{n:02d}-{k+1}-{os.path.basename(src)[3:-4]}.jpg"
        pin = Image.open(src).convert("RGB")
        W, H = 1080, 1350
        canvas = pin.resize((W, int(pin.height * W / pin.width))).crop((0, 0, W, H)).filter(ImageFilter.GaussianBlur(40))
        canvas = Image.blend(canvas, Image.new("RGB", (W, H), (250, 246, 241)), 0.75)
        h = 1290; w = int(pin.width * h / pin.height)
        canvas.paste(pin.resize((w, h), Image.LANCZOS), ((W - w) // 2, 30))
        canvas.save(out, quality=90)
        posts.append(dict(batch=n, pin=k + 1, name=name, title=title, desc=desc, link=fb, slug="fb-" + slug, image=os.path.basename(out), src=src))
json.dump(posts, open(sys.argv[2], "w"), indent=1)
print(len(posts))
