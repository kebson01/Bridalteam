import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/inspiration/actions", () => ({ saveInspiration: vi.fn(), reportImage: vi.fn(), toggleLike: vi.fn() }));
vi.mock("@/components/inspiration-comments", () => ({ default: () => null }));

import InspirationGallery, { PAGE_SIZE, type InspirationImage } from "./inspiration-gallery";

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

  it("shows a page of looks, then more on request", () => {
    const many = Array.from({ length: PAGE_SIZE + 3 }, (_, i) => item(`n${i}`, false));
    render(<InspirationGallery images={many} signedIn={false} userId={null} likedIds={[]} />);
    expect(screen.getAllByRole("button", { name: /^Open Look/ })).toHaveLength(PAGE_SIZE);
    fireEvent.click(screen.getByRole("button", { name: "Load more looks" }));
    expect(screen.getAllByRole("button", { name: /^Open Look/ })).toHaveLength(PAGE_SIZE + 3);
    expect(screen.queryByRole("button", { name: "Load more looks" })).toBeNull();
  });

  it("asks a signed-out visitor to sign up instead of saving", () => {
    render(<InspirationGallery images={[item("a", false)]} signedIn={false} userId={null} likedIds={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Save Look a" }));
    expect(screen.getByText("Sign up free to save looks")).toBeInTheDocument();
  });

  it("counts saved looks for the mood board link", () => {
    render(<InspirationGallery images={[item("a", false), item("b", false)]} signedIn userId="u" likedIds={["a"]} />);
    expect(screen.getByText("1 look saved")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save Look b" }));
    expect(screen.getByText("2 looks saved")).toBeInTheDocument();
  });

  it("places the promo card inside the grid", () => {
    render(<InspirationGallery images={[item("a", false)]} signedIn={false} userId={null} likedIds={[]} promo={<p>Mood board</p>} />);
    expect(screen.getByText("Mood board")).toBeInTheDocument();
  });
});
