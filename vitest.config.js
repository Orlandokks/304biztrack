import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html", "json-summary", "lcov"],
      include: [
        "safe-dom.js",
        "csv-utils.js",
        "accessibility.js",
        "i18n.js",
        "privacy-consent.js",
      ],
      thresholds: {
        statements: 80,
        functions: 80,
        lines: 80,
        branches: 70,
      },
    },
  },
});
