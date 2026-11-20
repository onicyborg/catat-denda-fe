import { test, expect } from "@playwright/test"
const credentials = {
  username: "browser.admin",
  password: "QA-only-password-12345",
}
async function login(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.getByLabel("Username", { exact: true }).fill(credentials.username)
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill(credentials.password)
  await page.getByRole("button", { name: "Masuk", exact: true }).click()
  await expect(page).toHaveURL(/dashboard$/)
  await expect(
    page.getByRole("button", { name: "Keluar", exact: true })
  ).toBeVisible()
  const menu = page.getByRole("button", { name: "Menu", exact: true })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole("link", { name: "Akun", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Akun admin" })).toBeVisible()
}
test("unsaved password form survives window refocus", async ({ page }) => {
  await login(page)
  const field = page.getByLabel("Kata sandi lama", { exact: true })
  await field.fill("unsaved-secret")
  const response = page.waitForResponse("**/api/v1/auth/me")
  await page.evaluate(() => window.dispatchEvent(new Event("focus")))
  await response
  await expect(field).toHaveValue("unsaved-secret")
  await page.route("**/api/v1/auth/me", (route) => route.abort())
  await page.evaluate(() => window.dispatchEvent(new Event("focus")))
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Layanan belum dapat dihubungi." })
  ).toBeVisible()
  await expect(field).toHaveValue("unsaved-secret")
  await page.unroute("**/api/v1/auth/me")
  await page.evaluate(() => window.dispatchEvent(new Event("focus")))
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Layanan belum dapat dihubungi." })
  ).toHaveCount(0)
})
test("expired session during password mutation redirects to login", async ({
  page,
  context,
}) => {
  await login(page)
  await context.clearCookies()
  await page
    .getByLabel("Kata sandi lama", { exact: true })
    .fill(credentials.password)
  await page
    .getByLabel("Kata sandi baru (minimal 12 karakter)", { exact: true })
    .fill("temporary-password-123")
  await page.getByRole("button", { name: "Simpan kata sandi" }).click()
  await expect(page).toHaveURL(/login$/)
})
test("desktop/mobile login, wrong password, password rotation and logout", async ({
  page,
  browser,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/login")
  await page.getByLabel("Username", { exact: true }).fill(credentials.username)
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill("incorrect-password")
  await page.getByRole("button", { name: "Masuk", exact: true }).click()
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Username atau kata sandi tidak sesuai." })
  ).toBeVisible()
  await expect(page.getByLabel("Username", { exact: true })).toHaveValue(
    credentials.username
  )
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill(credentials.password)
  await page.getByRole("button", { name: "Masuk", exact: true }).click()
  await expect(page).toHaveURL(/dashboard$/)
  await expect(
    page.getByRole("button", { name: "Keluar", exact: true })
  ).toBeVisible()
  const menu = page.getByRole("button", { name: "Menu", exact: true })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole("link", { name: "Akun", exact: true }).click()
  const other = await browser.newContext({ baseURL: "http://localhost:3100" })
  try {
    const res = await other.request.post("/api/v1/auth/login", {
      headers: { Origin: "http://localhost:3100" },
      data: credentials,
    })
    expect(res.status()).toBe(201)
    const old = page.getByLabel("Kata sandi lama", { exact: true })
    const next = page.getByLabel("Kata sandi baru (minimal 12 karakter)", {
      exact: true,
    })
    await old.fill("incorrect-password")
    await next.fill("new-QA-password-12345")
    await page.getByRole("button", { name: "Simpan kata sandi" }).click()
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Kata sandi lama tidak sesuai." })
    ).toBeVisible()
    await expect(page).toHaveURL(/settings$/)
    await expect(next).toHaveValue("new-QA-password-12345")
    await old.fill(credentials.password)
    await page.getByRole("button", { name: "Simpan kata sandi" }).click()
    await expect(
      page.getByRole("status").filter({ hasText: "Kata sandi diubah." })
    ).toBeVisible()
    expect((await other.request.get("/api/v1/auth/me")).status()).toBe(401)
    // Restore the QA password so the suite can be rerun with a fresh rate-limit window.
    await old.fill("new-QA-password-12345")
    await next.fill(credentials.password)
    await page.getByRole("button", { name: "Simpan kata sandi" }).click()
    await expect(old).toHaveValue("")
    const cookies = await page
      .context()
      .cookies("http://localhost:3100/api/v1/auth/me")
    expect(
      cookies.some(
        (c) => c.name === "efms_session" && c.httpOnly && c.path === "/api/v1"
      )
    ).toBeTruthy()
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: 800 })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBeTruthy()
    }
    await page.getByRole("button", { name: "Keluar", exact: true }).click()
    await expect(page).toHaveURL(/login$/)
    expect(
      (await page.context().cookies()).some((c) => c.name === "efms_session")
    ).toBeFalsy()
    await page.goto("/settings")
    await expect(page).toHaveURL(/login$/)
    expect(errors).toEqual([])
  } finally {
    await other.close()
  }
})
