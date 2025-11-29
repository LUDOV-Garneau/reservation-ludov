import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/app/api/**/*.test.{ts,js}"],
    coverage: {
      reporter: ["text", "lcov"],
    },
    env: {
      JWT_SECRET: "jwt-secret-for-unit-tests",
    },
  },
});
