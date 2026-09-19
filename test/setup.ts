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

// jsdom implements no layout, so Element.prototype.scrollTo doesn't exist at
// all. Any component that scrolls a container to the bottom throws inside
// requestAnimationFrame — after the assertions have already passed, so the
// test goes green while the run reports unhandled errors. That noise is worse
// than useless: it trains you to ignore errors in CI output, which is where a
// real one would appear. Stub it once, globally.
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo() {};
}
