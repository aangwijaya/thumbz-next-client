import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig keeps JSX for Next ("preserve"); tests need the automatic runtime.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
    coverage: {
      provider: "v8",
      // Unit tests target the logic layer; pages and visual components are
      // covered end to end by Playwright (e2e/), so they are not counted here.
      include: [
        "src/lib/**",
        "src/components/video/usePlaybackSession.ts",
        "src/components/account/**",
        "src/components/match/WatchLayout.tsx",
      ],
      exclude: ["src/**/*.test.*", "src/lib/api/schema.d.ts"],
      reporter: ["text-summary", "html"],
      // Floors just below today's values: coverage may only go up.
      thresholds: { lines: 40, statements: 40, functions: 30, branches: 70 },
    },
  },
});
