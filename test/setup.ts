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
