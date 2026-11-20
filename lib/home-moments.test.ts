import { describe, it, expect } from "vitest";
import { momentsPool } from "./home-moments";

const row = (image_url: string, title: string, media_type = "photo") => ({ image_url, title, media_type });

describe("momentsPool", () => {
  const STONEBRIDGE = "https://bridalteam.com/media/real-weddings/st-charles-2012-stonebridge.jpg";
  const CAKE = "https://images.pexels.com/photos/29051736/pexels-photo-29051736.jpeg?auto=compress";

  it("serves our own photos from a local path and splits out the wedding", () => {
    const [m] = momentsPool([row(STONEBRIDGE, "Stonebridge Golf & Country Club · St. Charles wedding, Boca Raton")]);
    expect(m).toEqual({
      src: "/media/real-weddings/st-charles-2012-stonebridge.jpg",
      caption: "Stonebridge Golf & Country Club",
      where: "St. Charles wedding · Boca Raton",
    });
  });

  it("labels vendor and stock photos as inspiration, never as a wedding", () => {
    const [m] = momentsPool([row(CAKE, "White flowers and greenery cake")]);
    expect(m.where).toBe("Inspiration");
  });

  it("only lets in photos checked to have no people", () => {
    const pool = momentsPool([
      // People in them, or never checked: all stay off the homepage.
      row("https://bridalteam.com/media/real-weddings/paul-2014-archway-kiss.jpg", "Kiss · Paul wedding, Parkland"),
      row("https://bridalteam.com/media/real-weddings/paul-2014-bridal-party.jpg", "Team Bride · Paul wedding, Parkland"),
      row("https://images.pexels.com/photos/27442593/pexels-photo-27442593.jpeg", "Seaside vows"),
      row("https://images.pexels.com/photos/99999999/new.jpeg", "A photo added later"),
      // A video, even of an allowed id.
      row("https://images.pexels.com/photos/29051736/poster.jpeg", "A film", "video"),
      row(CAKE, "White flowers and greenery cake"),
    ]);
    expect(pool.map((m) => m.caption)).toEqual(["White flowers and greenery cake"]);
  });

  it("skips duplicates and anything already shown", () => {
    const pool = momentsPool(
      [
        row("https://bridalteam.com/media/real-weddings/st-charles-2012-rings.jpg", "Rings · St. Charles wedding, Boca Raton"),
        row(CAKE, "White flowers and greenery cake"),
        row(CAKE, "White flowers and greenery cake"),
      ],
      [{ src: "/media/real-weddings/st-charles-2012-rings.jpg", caption: "Rings", where: "x" }],
    );
    expect(pool.map((m) => m.caption)).toEqual(["White flowers and greenery cake"]);
  });
});
