import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// CAPTCHA_SITE_KEY is a module constant read from the environment at import
// time, so it's mocked behind a getter to vary per test.
let siteKey = "0xTESTKEY0000000000000000";
vi.mock("@/lib/captcha", () => ({
  get CAPTCHA_SITE_KEY() {
    return siteKey;
  },
  get CAPTCHA_REQUIRED() {
    return siteKey.length > 0;
  },
}));

import Captcha from "./captcha";

type RenderOpts = Parameters<NonNullable<typeof window.turnstile>["render"]>[1];

/** Captures the options the component hands Turnstile, so callbacks can fire. */
function stubTurnstile() {
  let opts: RenderOpts | undefined;
  const remove = vi.fn();
  window.turnstile = {
    render: (_el, o) => {
      opts = o;
      return "widget-1";
    },
    remove,
  };
  return { getOpts: () => opts!, remove };
}

describe("Captcha", () => {
  beforeEach(() => {
    siteKey = "0xTESTKEY0000000000000000";
    delete (window as { turnstile?: unknown }).turnstile;
    document.getElementById("cf-turnstile")?.remove();
  });

  it("renders nothing when no site key is configured", () => {
    // This is what makes it safe to ship the widget before Supabase requires a
    // token: with no key the auth forms behave exactly as they did.
    siteKey = "";
    const { container } = render(<Captcha onToken={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mounts the widget with the configured site key", async () => {
    const { getOpts } = stubTurnstile();
    render(<Captcha onToken={() => {}} action="login" />);
    await waitFor(() => expect(getOpts()).toBeDefined());
    expect(getOpts().sitekey).toBe(siteKey);
    expect(getOpts().action).toBe("login");
  });

  it("passes the solved token to the caller", async () => {
    const onToken = vi.fn();
    const { getOpts } = stubTurnstile();
    render(<Captcha onToken={onToken} />);
    await waitFor(() => expect(getOpts()).toBeDefined());
    getOpts().callback("a-token");
    expect(onToken).toHaveBeenCalledWith("a-token");
  });

  it("surfaces a 110200 as our problem, naming the code", async () => {
    // 110200 is "hostname not on the widget's allowed-domains list". Cloudflare
    // renders it as "Unable to connect to website", which reads as a network
    // fault or an ad blocker. It is neither — it is a misconfiguration only an
    // operator can fix, and the code is the only thing that says so.
    const onToken = vi.fn();
    const { getOpts, remove } = stubTurnstile();
    render(<Captcha onToken={onToken} />);
    await waitFor(() => expect(getOpts()).toBeDefined());

    getOpts()["error-callback"]!("110200");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/110200/);
    expect(alert).toHaveTextContent(/on us/i);
    expect(onToken).toHaveBeenCalledWith(null);
    // Cloudflare's own error box is taken down so there aren't two messages.
    expect(remove).toHaveBeenCalledWith("widget-1");
  });

  it("leaves transient errors to Turnstile's own retry", async () => {
    // 300xxx/600xxx are execution failures Turnstile retries itself. Replacing
    // the widget with a permanent-looking message would strand a visitor who
    // would otherwise have been let through a second later.
    const onToken = vi.fn();
    const { getOpts, remove } = stubTurnstile();
    render(<Captcha onToken={onToken} />);
    await waitFor(() => expect(getOpts()).toBeDefined());

    getOpts()["error-callback"]!("300010");

    expect(onToken).toHaveBeenCalledWith(null);
    expect(remove).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("clears the token when the challenge expires", async () => {
    const onToken = vi.fn();
    const { getOpts } = stubTurnstile();
    render(<Captcha onToken={onToken} />);
    await waitFor(() => expect(getOpts()).toBeDefined());
    getOpts()["expired-callback"]!();
    expect(onToken).toHaveBeenCalledWith(null);
  });

  it("says so plainly when the script itself is blocked", async () => {
    // No window.turnstile, so the component injects the script and waits. An
    // ad blocker or a missing CSP entry fails it.
    const onToken = vi.fn();
    render(<Captcha onToken={onToken} />);
    const script = await waitFor(() => {
      const el = document.getElementById("cf-turnstile");
      if (!el) throw new Error("script not injected");
      return el;
    });
    script.dispatchEvent(new Event("error"));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/blocker/i);
    expect(onToken).toHaveBeenCalledWith(null);
  });
});
