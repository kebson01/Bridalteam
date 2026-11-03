import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/inspiration/actions", () => ({ saveInspiration: vi.fn(), reportImage: vi.fn(), toggleLike: vi.fn() }));
vi.mock("@/components/inspiration-comments", () => ({ default: () => null }));

import InspirationGallery, { type InspirationImage } from "./inspiration-gallery";

const item = (id: string, is_seed: boolean): InspirationImage => ({
  id,
  image_url: `https://images.pexels.com/${id}.jpg`,
  title: `Look ${id}`,
  theme: "Garden",
  colors: [],
  media_type: "photo",
  media_url: null,
  is_seed,
});

describe("InspirationGallery", () => {
  it("labels Bridal Team's starter looks and nothing else", () => {
    render(<InspirationGallery images={[item("real", false), item("seed", true)]} signedIn={false} userId={null} likedIds={[]} />);
    expect(screen.getAllByText("Bridal Team Ideas")).toHaveLength(1);
    const badge = screen.getByText("Bridal Team Ideas");
    expect(badge.closest("button")?.textContent).toContain("Look seed");
  });
});
