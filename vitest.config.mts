import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // vite 8 transforms TS/JSX with oxc — match the jsx runtime the Next app
  // uses so component tests compile the same way.
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: false,
  },
});
