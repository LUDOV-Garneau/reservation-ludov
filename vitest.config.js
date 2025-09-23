import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/app/api/db-test/**/*.test.{ts,js}"],
    coverage: {
      reporter: ["text", "lcov"],
    },
    setupFiles: [],
  },
});
