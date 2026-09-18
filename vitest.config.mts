import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Unit and component tests. Deliberately no network, no database and no
 * secrets: CI runs on pull requests from forks, and a suite that needs a key
 * can't be verified there (same reasoning as the build step — see
 * .github/workflows/ci.yml).
 *
 * That rules out a true end-to-end signup, which needs a live Supabase project
 * and a real Turnstile token. What is covered here is everything between:
 * the pure logic and the client components whose failures are invisible to
 * `tsc` but visible to a visitor.
 */
export default defineConfig({
  plugins: [react()],
  // Resolves the "@/..." aliases from tsconfig.json. Native in this Vite —
  // the vite-tsconfig-paths plugin the Next guide suggests is no longer needed
  // and warns as much on startup.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
