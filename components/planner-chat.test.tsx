import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderMessage } from "./planner-chat";

/**
 * renderMessage feeds dangerouslySetInnerHTML, so its whole contract is:
 * three tags come from us, everything else arrives as text.
 *
 * The text is a model reply, and a model will happily echo whatever it is
 * asked to. Chat is currently useState-only — not persisted, not shared — so
 * the blast radius is the prompter's own browser. That is a property of
 * today's storage, not of this function, so the escaping is tested here rather
 * than argued about at the call site.
 */
function draw(text: string) {
  return render(<div data-testid="out">{renderMessage(text)}</div>);
}

describe("renderMessage", () => {
  it("renders an injected tag as text, not as an element", () => {
    const { container } = draw('<img src=x onerror="alert(1)">');
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByTestId("out")).toHaveTextContent('<img src=x onerror="alert(1)">');
  });

  it("does not let a payload escape through the bold syntax", () => {
    // The bold capture group is the obvious way to smuggle markup in, since
    // its contents are interpolated into a real tag.
    const { container } = draw("**<script>alert(1)</script>**");
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("strong")).not.toBeNull();
    expect(container.querySelector("strong")).toHaveTextContent("<script>alert(1)</script>");
  });

  it("strips no legitimate formatting", () => {
    const { container } = draw("## Budget\n**Venue** is the biggest line\n- Book early");
    expect(container.querySelector("span.font-semibold")).toHaveTextContent("Budget");
    expect(container.querySelector("strong")).toHaveTextContent("Venue");
    expect(container.querySelector("li")).toHaveTextContent("Book early");
  });

  it("shows an ampersand once, not double-escaped", () => {
    // `&` has to be escaped first or the entities from the later replacements
    // get re-escaped and the reader sees "&amp;lt;".
    draw("Alex & Sam, 150 guests");
    expect(screen.getByTestId("out")).toHaveTextContent("Alex & Sam, 150 guests");
    expect(screen.getByTestId("out").innerHTML).not.toContain("&amp;amp;");
  });

  it("leaves a literal entity looking like what the model typed", () => {
    draw("Write &lt;b&gt; to show a bold tag");
    expect(screen.getByTestId("out")).toHaveTextContent("Write &lt;b&gt; to show a bold tag");
  });

  it("keeps quotes and apostrophes as characters", () => {
    draw(`She said "yes" — it's booked`);
    expect(screen.getByTestId("out")).toHaveTextContent(`She said "yes" — it's booked`);
  });

  it("renders a blank line as a spacer rather than dropping it", () => {
    const { container } = draw("one\n\ntwo");
    expect(container.querySelectorAll("p")).toHaveLength(2);
    expect(container.querySelector("div.h-2")).not.toBeNull();
  });
});
