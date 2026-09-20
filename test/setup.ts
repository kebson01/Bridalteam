import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// The /vitest entry point registers the matchers AND augments vitest's
// Assertion type, so `toBeInTheDocument` and friends typecheck as well as run.
// Importing the bare matchers and calling expect.extend does the first but not
// the second, and `npm run typecheck` covers these files.
import "@testing-library/jest-dom/vitest";

// React Testing Library doesn't unmount between tests on its own when
// `globals` is on and no per-file cleanup is registered.
afterEach(cleanup);

// jsdom keeps ONE sessionStorage/localStorage for the whole file, so anything
// a component writes outlives the test that wrote it. A real visitor always
// arrives with empty storage, which is what every test here assumes — without
// this, a planner draft saved by one test restores itself into the next and
// makes assertions depend on test order. Found the hard way: it turned a
// passing conversion test red the moment the planner started persisting
// transcripts.
afterEach(() => {
  try {
    sessionStorage.clear();
    localStorage.clear();
  } catch {
    // Storage disabled in this environment; nothing to reset.
  }
});

// jsdom implements no layout, so Element.prototype.scrollTo doesn't exist at
// all. Any component that scrolls a container to the bottom throws inside
// requestAnimationFrame — after the assertions have already passed, so the
// test goes green while the run reports unhandled errors. That noise is worse
// than useless: it trains you to ignore errors in CI output, which is where a
// real one would appear. Stub it once, globally.
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo() {};
}

// jsdom has no navigator.sendBeacon, so lib/events.ts::track() falls through to
// its fetch fallback — which lands on whatever `fetch` a component test has
// mocked, adding phantom calls to a spy that exists to assert something else.
// A component under test would then fail on a metrics call it never made.
// Stubbing the beacon keeps funnel counting entirely out of the way of tests,
// and matches what a real browser does anyway.
if (!navigator.sendBeacon) {
  Object.defineProperty(navigator, "sendBeacon", {
    value: () => true,
    writable: true,
    configurable: true,
  });
}
