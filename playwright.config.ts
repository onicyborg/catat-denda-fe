import { defineConfig } from "@playwright/test"
export default defineConfig({
  testDir: "./tests",
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://localhost:3100",
    channel: "chrome",
    viewport: { width: 360, height: 800 },
  },
  webServer: {
    command: "pnpm dev --port 3100",
    url: "http://localhost:3100/login",
    env: {
      NEXT_TEST_DIST_DIR: ".next-qa",
      API_INTERNAL_URL: "http://127.0.0.1:3101",
    },
    reuseExistingServer: false,
  },
})
