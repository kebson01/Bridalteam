# story.json

One folder per story, kept outside the repository:

```
st-charles-2012/
  story.json
  getting-ready.jpg
  rings.jpg
  groomsmen-gazebo.jpg
```

```json
{
  "slug": "st-charles-boca-raton-2012",
  "couple_names": "Kebson & Tricia St. Charles",
  "wedding_date": "2012-05-05",
  "city": "Boca Raton",
  "venue": "Stonebridge Golf & Country Club",
  "title": "A gazebo wedding at Stonebridge in Boca Raton",
  "summary": "One or two sentences for the card on /real-weddings.",
  "story": ["Paragraph one.", "Paragraph two."],
  "cover": "getting-ready.jpg",
  "photos": [
    { "file": "getting-ready.jpg", "alt": "Bridesmaids in rose gowns help the bride into her dress" }
  ],
  "vendors": [
    { "role": "Venue", "name": "Stonebridge Golf & Country Club", "url": "https://..." }
  ],
  "photographer": "Studio name",
  "consent": {
    "confirmed_at": "2026-11-03",
    "note": "Kebson and Tricia agreed in person; groomsmen agreed by text."
  }
}
```

- `slug`: lowercase words and hyphens. It becomes `/real-weddings/<slug>`.
- `story`: a list of paragraphs, or one string with blank lines between them.
  Plain text only.
- `photos`: in the order they should appear. `alt` describes the photo for
  screen readers; don't put names in it unless the person agreed.
- `photographer` and `vendors`: to link the photographer's name, also list
  them in `vendors` with `"role": "Photography"`, the same name, and their
  `url`. The page links the credit and doesn't list them twice.
- `consent`: leave it out until it's true. Without it the story uploads as a
  draft and cannot be published.
- Any `[bracketed text]` anywhere blocks the upload.
