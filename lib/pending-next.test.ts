import { describe, it, expect, beforeEach } from "vitest";
import { isResumable, savePendingNext, takePendingNext } from "./pending-next";

/**
 * This exists because the primary mechanism already looked correct.
 *
 * `?next=` was passed, forwarded as `emailRedirectTo`, and read back by both
 * auth routes — and the first real vendor still ended up on /onboarding and
 * created a duplicate listing, because the confirmation email did not carry
 * `next` through. So the fallback has to be tested on its own, and the
 * open-redirect surface it introduces has to be pinned: the value is read back
 * out of storage the visitor's extensions can write to, and then navigated to.
 */
beforeEach(() => sessionStorage.clear());

describe("isResumable", () => {
  it("accepts the two token flows that need resuming", () => {
    expect(isResumable("/claim/abc123")).toBe(true);
    expect(isResumable("/invite/xyz789")).toBe(true);
  });

  it("rejects a protocol-relative URL that would leave the origin", () => {
    // The case a naive startsWith("/") check waves through. "//evil.com"
    // is a URL to another host, and router.replace would honour it.
    expect(isResumable("//evil.com")).toBe(false);
    expect(isResumable("//evil.com/claim/abc")).toBe(false);
  });

  it("rejects absolute URLs and non-paths", () => {
    expect(isResumable("https://evil.com/claim/abc")).toBe(false);
    expect(isResumable("javascript:alert(1)")).toBe(false);
    expect(isResumable("")).toBe(false);
  });

  it("rejects local paths outside the two flows", () => {
    // Not a security hole, but resuming to an arbitrary page would make this
    // a general redirect mechanism, which is how open redirects get built.
    expect(isResumable("/dashboard")).toBe(false);
    expect(isResumable("/vendor")).toBe(false);
    expect(isResumable("/")).toBe(false);
  });
});

describe("savePendingNext / takePendingNext", () => {
  it("round-trips a claim path", () => {
    savePendingNext("/claim/token-123");
    expect(takePendingNext()).toBe("/claim/token-123");
  });

  it("clears on read, so a stale destination cannot hijack a later visit", () => {
    savePendingNext("/claim/token-123");
    expect(takePendingNext()).toBe("/claim/token-123");
    expect(takePendingNext()).toBeNull();
  });

  it("never stores a destination it would refuse to resume", () => {
    savePendingNext("//evil.com");
    savePendingNext("https://evil.com/claim/x");
    savePendingNext("/dashboard");
    expect(takePendingNext()).toBeNull();
  });

  it("re-validates on read, not just on write", () => {
    // Storage is writable by the visitor's own extensions, so what comes back
    // is not necessarily what was put in.
    sessionStorage.setItem("bt_pending_next", "https://evil.com/claim/x");
    expect(takePendingNext()).toBeNull();
  });

  it("ignores empty and missing values", () => {
    savePendingNext(null);
    savePendingNext(undefined);
    savePendingNext("");
    expect(takePendingNext()).toBeNull();
  });
});
