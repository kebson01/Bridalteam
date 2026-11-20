import { describe, it, expect } from "vitest";
import { momentsPool } from "./home-moments";

const row = (image_url: string, title: string, media_type = "photo") => ({ image_url, title, media_type });

describe("momentsPool", () => {
  it("serves our own photos from a local path and splits out the wedding", () => {
    const [m] = momentsPool([row("https://bridalteam.com/media/real-weddings/paul-2014-bridal-party.jpg", "Team Bride · Paul wedding, Parkland")]);
    expect(m).toEqual({ src: "/media/real-weddings/paul-2014-bridal-party.jpg", caption: "Team Bride", where: "Paul wedding · Parkland" });
  });

  it("labels vendor and stock photos as inspiration, never as a wedding", () => {
    const [m] = momentsPool([row("https://images.pexels.com/photos/1/a.jpeg", "Garden party")]);
    expect(m.where).toBe("Inspiration");
  });

  it("leaves out videos and the photos the owner kept off the homepage", () => {
    const pool = momentsPool([
      row("https://img.youtube.com/vi/x/hqdefault.jpg", "A film", "video"),
      row("https://bridalteam.com/media/real-weddings/paul-2014-archway-kiss.jpg", "Kiss · Paul wedding, Parkland"),
      row("https://bridalteam.com/media/real-weddings/paul-2014-blessing.jpg", "Blessing · Paul wedding, Parkland"),
      row("https://bridalteam.com/media/real-weddings/paul-2014-groomsmen-lake.jpg", "Lake · Paul wedding, Parkland"),
      row("https://images.pexels.com/photos/2/b.jpeg", "Seaside vows"),
    ]);
    expect(pool.map((m) => m.caption)).toEqual(["Seaside vows"]);
  });

  it("skips duplicates and anything already shown", () => {
    const pool = momentsPool(
      [
        row("https://bridalteam.com/media/real-weddings/st-charles-2012-rings.jpg", "Rings · St. Charles wedding, Boca Raton"),
        row("https://images.pexels.com/photos/3/c.jpeg", "Clean lines"),
        row("https://images.pexels.com/photos/3/c.jpeg", "Clean lines"),
      ],
      [{ src: "/media/real-weddings/st-charles-2012-rings.jpg", caption: "Rings", where: "x" }],
    );
    expect(pool.map((m) => m.caption)).toEqual(["Clean lines"]);
  });
});
