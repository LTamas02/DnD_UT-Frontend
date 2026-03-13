import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    clearMocks: true,
    exclude: ["**/src/App.test.js", "**/node_modules/**", "**/build/**"]
  }
});
