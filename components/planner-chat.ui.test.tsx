import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlannerChat from "./planner-chat";
import { SIGNUP_URL } from "@/lib/config";

/**
 * What this guards is a conversion path, not a crash.
 *
 * The API had always returned the right words at the demo limit — "sign up
 * free" — but as bold markdown that nothing rendered as a link, and the
 * component ignored the `limited` flag entirely. So the single moment a
 * visitor was most interested, having just tried to ask another question and
 * been stopped, was a dead end with nothing to click. Nothing threw; it just
 * silently didn't convert. That is precisely the class of bug a test has to
 * hold, because no error will ever point at it.
 */
function mockReply(body: Record<string, unknown>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  } as unknown as Response);
}

async function ask(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByPlaceholderText(/ask about your wedding/i), text);
  await user.click(screen.getByRole("button", { name: /send/i }));
}

describe("PlannerChat conversion path", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it("gives an anonymous visitor a real link at the demo limit", async () => {
    vi.stubGlobal("fetch", mockReply({ reply: "Demo over.", limited: true, cta: "signup" }));
    const user = userEvent.setup();
    render(<PlannerChat />);

    await ask(user, "budget for 150 guests?");

    const link = await screen.findByRole("link", { name: /create my free account/i });
    expect(link).toHaveAttribute("href", SIGNUP_URL);
    // And the box that can only produce the same refusal is gone.
    expect(screen.queryByPlaceholderText(/ask about your wedding/i)).toBeNull();
  });

  it("sends a signed-in visitor to pricing, not to signup", async () => {
    vi.stubGlobal("fetch", mockReply({ reply: "Limit reached.", limited: true, cta: "upgrade" }));
    const user = userEvent.setup();
    render(<PlannerChat />);

    await ask(user, "another question");

    const link = await screen.findByRole("link", { name: /see plans/i });
    expect(link).toHaveAttribute("href", "/pricing");
    expect(screen.queryByRole("link", { name: /create my free account/i })).toBeNull();
    // The signup-only reassurance must not leak into the paid wall — telling
    // someone who already has an account that no card is needed is nonsense
    // at exactly the moment you are asking them for one.
    expect(screen.queryByText(/no card needed/i)).toBeNull();
    expect(screen.queryByRole("link", { name: /already have an account/i })).toBeNull();
  });

  it("offers to save the conversation after the second answer", async () => {
    vi.stubGlobal("fetch", mockReply({ reply: "Here you go.", tier: "anon" }));
    const user = userEvent.setup();
    render(<PlannerChat />);

    await ask(user, "first");
    // One answer in: too early to ask for anything.
    expect(screen.queryByText(/create a free account/i)).toBeNull();

    await ask(user, "second");
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /create a free account/i })).toHaveAttribute(
        "href",
        SIGNUP_URL,
      ),
    );
  });

  it("never nudges a signed-in visitor", async () => {
    // They already have everything the nudge offers; it would just be nagging.
    vi.stubGlobal("fetch", mockReply({ reply: "Here you go.", tier: "free" }));
    const user = userEvent.setup();
    render(<PlannerChat />);

    await ask(user, "first");
    await ask(user, "second");

    expect(screen.queryByRole("link", { name: /create a free account/i })).toBeNull();
    expect(screen.getByPlaceholderText(/ask about your wedding/i)).toBeInTheDocument();
  });

  it("stays dismissed once dismissed", async () => {
    vi.stubGlobal("fetch", mockReply({ reply: "Here you go.", tier: "anon" }));
    const user = userEvent.setup();
    render(<PlannerChat />);

    await ask(user, "first");
    await ask(user, "second");
    await user.click(await screen.findByRole("button", { name: /dismiss/i }));
    expect(screen.queryByRole("link", { name: /create a free account/i })).toBeNull();

    await ask(user, "third");
    expect(screen.queryByRole("link", { name: /create a free account/i })).toBeNull();
  });

  it("keeps the input alive on a normal reply", async () => {
    vi.stubGlobal("fetch", mockReply({ reply: "A real answer.", tier: "anon" }));
    const user = userEvent.setup();
    render(<PlannerChat />);

    await ask(user, "hello");

    expect(await screen.findByText(/a real answer/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ask about your wedding/i)).toBeInTheDocument();
  });
});

/**
 * The 404 this closes.
 *
 * /planner carries no feature flag — it is the public demo and the whole
 * top-of-funnel pitch — but /auth/signup and /auth/login both notFound() when
 * SHOW_PLANNER_APP is off (app/auth/signup/page.tsx). This component
 * hard-coded both, so in waitlist mode the three highest-intent CTAs in the
 * product (the nudge, the wall, "already have an account?") led to a 404. Not
 * a crash, not a failing test — just a dead end at the exact moment someone
 * decided the product was worth something.
 *
 * Both directions are asserted because only the pair pins the behaviour: the
 * "on" case alone passes against a hard-coded literal, which is how this got
 * through the first time.
 */
describe("PlannerChat signup target tracks whether accounts are open", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  async function wallHref(plannerAppOn: boolean): Promise<string | null> {
    vi.stubEnv("NEXT_PUBLIC_SHOW_PLANNER_APP", plannerAppOn ? "true" : "");
    // Re-imported so the module-scope flag read picks up the stub.
    const { default: Chat } = await import("./planner-chat");
    vi.stubGlobal("fetch", mockReply({ reply: "Demo over.", limited: true, cta: "signup" }));
    const user = userEvent.setup();
    render(<Chat />);
    await ask(user, "budget for 150 guests?");
    const link = await screen.findByRole("link", { name: /create my free account/i });
    return link.getAttribute("href");
  }

  it("sends people to the waitlist while accounts are closed", async () => {
    expect(await wallHref(false)).toBe("/signup");
  });

  it("sends people to real signup once accounts are open", async () => {
    expect(await wallHref(true)).toBe("/auth/signup");
  });
});
