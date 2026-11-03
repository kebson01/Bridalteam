import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PlannerWeddingCard, { formatEventDate, type PlannerWedding } from "./planner-wedding-card";

const wedding: PlannerWedding = {
  id: "00000000-0000-4000-8000-000000000001",
  partner_one: "Sophia",
  partner_two: "Liam",
  event_date: "2026-10-24",
  city: "Palm Beach",
  region: "FL",
  venue: "Garden Estate",
  guest_count: 150,
  tasksDone: 19,
  tasksTotal: 50,
};

describe("PlannerWeddingCard", () => {
  it("shows the couple, details, checklist progress and an edit link", () => {
    render(<PlannerWeddingCard wedding={wedding} signedIn />);
    expect(screen.getByText("Sophia & Liam")).toBeInTheDocument();
    expect(screen.getByText("Oct 24, 2026")).toBeInTheDocument();
    expect(screen.getByText("Palm Beach, FL")).toBeInTheDocument();
    expect(screen.getByText("150 guests")).toBeInTheDocument();
    expect(screen.getByText("38% complete · 19 of 50")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "38");
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("href", `/w/${wedding.id}`);
  });

  it("prompts for missing details instead of showing blanks", () => {
    render(<PlannerWeddingCard wedding={{ ...wedding, venue: null, guest_count: null, tasksDone: 0, tasksTotal: 0 }} signedIn />);
    expect(screen.getByText("Add venue")).toBeInTheDocument();
    expect(screen.getByText("Add guests")).toBeInTheDocument();
    expect(screen.getByText(/No tasks yet/)).toBeInTheDocument();
  });

  it("invites a signed-out visitor to sign up", () => {
    render(<PlannerWeddingCard wedding={null} signedIn={false} />);
    expect(screen.getByRole("link", { name: "Start free" })).toBeInTheDocument();
  });

  it("sends a signed-in couple with no wedding to add one", () => {
    render(<PlannerWeddingCard wedding={null} signedIn />);
    expect(screen.getByRole("link", { name: "Add my wedding" })).toHaveAttribute("href", "/onboarding");
  });
});

describe("formatEventDate", () => {
  it("keeps the calendar day whatever the timezone", () => {
    expect(formatEventDate("2026-01-01")).toBe("Jan 1, 2026");
    expect(formatEventDate(null)).toBeNull();
    expect(formatEventDate("soon")).toBeNull();
  });
});
