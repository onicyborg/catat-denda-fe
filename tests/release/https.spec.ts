import { test, expect } from "@playwright/test"
import { readFile } from "node:fs/promises"

test("production HTTPS authentication, protected pages and warm mobile performance", async ({
  page,
  context,
}, info) => {
  const credentials = JSON.parse(
    await readFile("/tmp/catat-denda-release-credentials.json", "utf8")
  )
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  expect((await context.request.get("/api/v1/reports/summary")).status()).toBe(
    401
  )
  expect((await context.request.get("/api/v1/health/ready")).status()).toBe(404)
  const html = await page.goto("/login")
  expect(html?.headers()["strict-transport-security"]).toContain("max-age=")
  await expect(page.getByLabel("Username", { exact: true })).toHaveValue("")
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveValue("")
  await page.getByLabel("Username", { exact: true }).fill(credentials.username)
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill(credentials.password)
  const response = page.waitForResponse("**/api/v1/auth/login")
  await page.getByRole("button", { name: "Masuk", exact: true }).click()
  const login = await response
  expect(login.status()).toBe(201)
  const csrfToken = (await login.json()).data.csrfToken as string
  expect(login.headers()["cache-control"]).toBe("no-store")
  const cookie = (await context.cookies()).find(
    (c) => c.name === "efms_session"
  )
  expect(cookie).toMatchObject({
    secure: true,
    httpOnly: true,
    sameSite: "Lax",
    path: "/api/v1",
  })
  await expect(page).toHaveURL(/dashboard$/)
  await expect(
    page.getByRole("button", { name: "Keluar", exact: true })
  ).toBeVisible()
  for (const path of [
    "/employees",
    "/fines",
    "/payments",
    "/reports",
    "/audit-logs",
    "/settings",
  ]) {
    // Settle prefetch before a full document reload; WebKit reports aborted RSC fetches as page errors.
    await page.waitForLoadState("networkidle")
    await page.goto(path)
    await expect(
      page.getByRole("button", { name: "Keluar", exact: true })
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBeTruthy()
  }
  const noCsrf = await context.request.post("/api/v1/auth/logout", {
    headers: { Origin: "https://localhost:3443" },
  })
  expect(noCsrf.status()).toBe(403)
  const foreign = await context.request.post("/api/v1/auth/logout", {
    headers: {
      Origin: "https://foreign.example.test",
      "X-CSRF-Token": csrfToken,
    },
  })
  expect(foreign.status()).toBe(403)
  if (info.project.name === "chrome") {
    await page.setViewportSize({ width: 390, height: 844 })
    const cdp = await context.newCDPSession(page)
    await cdp.send("Network.enable")
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 40,
      downloadThroughput: 200000,
      uploadThroughput: 93750,
    })
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 })
    // Warm assets; include the first authenticated data response in the timing.
    const warmed = page.waitForResponse(
      (r) => r.url().includes("/api/v1/dashboard/summary") && r.status() === 200
    )
    await page.goto("/dashboard")
    await warmed
    const loaded = page.waitForResponse(
      (r) => r.url().includes("/api/v1/dashboard/summary") && r.status() === 200
    )
    const started = Date.now()
    await page.goto("/dashboard")
    await loaded
    await expect(
      page.getByRole("button", { name: "Keluar", exact: true })
    ).toBeEnabled()
    const elapsedMs = Date.now() - started
    await info.attach("warm-mobile-performance", {
      body: JSON.stringify({
        elapsedMs,
        latencyMs: 40,
        downloadMbps: 1.6,
        uploadMbps: 0.75,
        cpuSlowdown: 4,
        dataset: "isolated QA, no operational records",
      }),
      contentType: "application/json",
    })
    console.log("WARM_MOBILE_INTERACTIVE_MS", elapsedMs)
    expect(elapsedMs).toBeLessThan(3000)
    await cdp.detach()
  }
  await page.getByRole("button", { name: "Keluar", exact: true }).click()
  await expect(page).toHaveURL(/login$/)
  expect(
    (await context.cookies()).some((c) => c.name === "efms_session")
  ).toBeFalsy()
  expect(errors).toEqual([])
})
