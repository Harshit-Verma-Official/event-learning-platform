import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    clearMocks: true,
    setupFiles: ["./tests/setup.ts"],
    // All test files share the same Postgres test database (see .env.test).
    // Running files in parallel causes them to race on the same tables
    // (e.g. one file's deleteMany() wipes another file's seeded rows),
    // so test files must run sequentially.
    fileParallelism: false,
  },
});
