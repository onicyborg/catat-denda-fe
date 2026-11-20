import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/release",
  outputDir: "test-results-release",
  workers: 1,
  retries: 0,
  timeout: 60000,
  use: {
    baseURL: "https://localhost:3443",
    ignoreHTTPSErrors: true, // Disposable self-signed localhost certificate only.
  },
  projects: [
    { name: "chrome", use: { browserName: "chromium", channel: "chrome" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit-mobile", use: { ...devices["iPhone 13"] } },
  ],
})
