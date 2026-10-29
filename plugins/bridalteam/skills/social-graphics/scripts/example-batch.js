// An example batch spec for render.js: two pins and a two-frame story,
// built only from the shared helpers. Copy it, replace the content, and keep
// every fact traceable to the page the pin links to.
//
// Pins and stories render separately (one format per spec), so a real batch
// file returns either pins or story frames. This file picks with BT_FORMAT so
// one example shows both: BT_FORMAT=story node render.js example-batch.js out/

module.exports = (h) => {
  if (process.env.BT_FORMAT === "story") {
    return {
      format: "story",
      items: {
        "1-hook": h.story(1, 2, `
          <div style="margin:auto 0">
            <div class="k">Planning a wedding?</div>
            <h1 style="font-size:124px">Example hook frame</h1>
          </div>`, true),
        "2-checklist": h.story(2, 2, `
          <div class="k">1 · Checklist</div>
          <h1>Every deadline, from your date</h1>
          <div style="margin-top:40px">${h.rows([["Book your venue", "10 months"], ["Mail invitations", "10 weeks"]])}</div>
          ${h.tap()}`),
      },
    };
  }
  return {
    format: "pin",
    items: {
      // From lib/plan-template.ts (MONTH = 30 days).
      "01-example-rows": `
        ${h.band("Free checklist", "When to do what, for your date")}
        ${h.wrap(h.rows([["Book your venue", "10 months"], ["Book your photographer", "9 months"], ["Mail your invitations", "10 weeks"]]) + h.note("Before the wedding."))}
        ${h.foot("Add your date, get every deadline")}`,
      // Photo layouts. public/brand/hero.jpg stands in here; for a real pin use
      // a full-size licensed photo downloaded per references/photos.md.
      "03-example-photo-full": `
        ${h.photoFull("public/brand/hero.jpg", "Wedding planning", "Your whole wedding, one free plan", { sub: "Checklist, budget, guest list and website." })}
        ${h.foot("Start planning free")}`,
      "04-example-photo-top": `
        ${h.photoTop("public/brand/hero.jpg", 620)}
        ${h.wrap(`<div class="d" style="font-size:72px;font-weight:700;line-height:1.05">When to do what, for your date</div>` + h.rows([["Book your venue", "10 months"], ["Mail invitations", "10 weeks"]]), 44)}
        ${h.foot("Add your date, get every deadline")}`,
      // From the registry guide in lib/guides.ts.
      "02-example-numbered": `
        ${h.band("Wedding registry", "Registry rules guests will thank you for", 80)}
        ${h.wrap(h.numbered([["Register early", "Before you send save-the-dates."], ["About 2 gifts per guest", "Across low, medium and higher prices."]]))}
        ${h.foot("How to set up your registry")}`,
    },
  };
};
