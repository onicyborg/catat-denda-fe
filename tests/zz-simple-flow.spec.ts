import { test, expect } from "@playwright/test"
import { contrastFailures } from "./helpers/contrast"
test.use({ storageState: "/tmp/catat-denda-master-qa-session.json" })

test("mobile daily flow: record a fine, find employee balance and record payment without opening the case", async ({
  page,
}) => {
  const me = (await (await page.request.get("/api/v1/auth/me")).json()).data
  const suffix = crypto.randomUUID().slice(0, 8)
  const headers = {
    Origin: "http://localhost:3100",
    "X-CSRF-Token": me.csrfToken,
  }
  const create = async (path: string, data: object) => {
    const response = await page.request.post(`/api/v1/${path}`, {
      headers,
      data,
    })
    expect(response.status()).toBe(201)
    return (await response.json()).data
  }
  const employee = await create("employees", { displayName: "Naya " + suffix })
  const type = await create("violation-types", {
    code: "SIMPLE-" + suffix,
    name: "Terlambat " + suffix,
    category: "OTHER",
    defaultAmountPerPerson: 5000,
  })
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.setViewportSize({ width: 375, height: 812 })
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  )
  await page.goto("/dashboard")
  const nav = page.getByRole("navigation", { name: "Navigasi mobile" })
  await nav.getByRole("link", { name: "Catat", exact: true }).click()
  await page
    .getByRole("button", { name: "Pilih jenis kesalahan", exact: true })
    .click()
  await page.getByRole("dialog").getByLabel("Cari pilihan").fill(type.name)
  await page
    .getByRole("dialog")
    .getByRole("button", { name: new RegExp(type.name) })
    .click()
  await expect(
    page.getByLabel("Deskripsi kejadian", { exact: true })
  ).toHaveValue(type.name)
  await page
    .getByRole("button", { name: "Pilih karyawan", exact: true })
    .click()
  await page
    .getByRole("dialog")
    .getByLabel("Cari pilihan")
    .fill(employee.displayName)
  await page
    .getByRole("dialog")
    .getByRole("button", { name: new RegExp(employee.displayName) })
    .click()
  await page.getByRole("button", { name: /Selesai/ }).click()
  await expect(page.getByLabel("Nominal peserta 1 (Rp)")).toHaveValue("5000")
  await page.getByRole("button", { name: "Simpan denda", exact: true }).click()
  await expect(page).toHaveURL(/\/fines\/[a-f0-9-]+$/)
  await expect(page.getByText("Status pembayaran: Belum dibayar")).toBeVisible()
  await nav.getByRole("link", { name: "Karyawan", exact: true }).click()
  await page
    .getByLabel("Cari nama, kode, atau alias")
    .fill(employee.displayName)
  await page.getByRole("button", { name: "Cari", exact: true }).click()
  await page
    .getByRole("link", { name: employee.displayName, exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: employee.displayName, exact: true })
  ).toBeVisible()
  await expect(
    page.getByText("Sisa denda saat ini", { exact: true })
  ).toBeVisible()
  await nav.getByRole("button", { name: "Lainnya", exact: true }).click()
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Pembayaran", exact: true })
    .click()
  await page
    .getByRole("link", { name: "Catat pembayaran", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Pilih karyawan", exact: true })
    .click()
  await page
    .getByRole("dialog")
    .getByLabel("Cari pilihan")
    .fill(employee.displayName)
  await page
    .getByRole("dialog")
    .getByRole("button", { name: new RegExp(employee.displayName) })
    .click()
  await page
    .getByRole("button", { name: "Catat pembayaran", exact: true })
    .click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Nominal pembayaran (Rp)").fill("2000")
  await dialog
    .getByRole("button", { name: "Simpan pembayaran", exact: true })
    .click()
  await expect(dialog).toBeHidden()
  await expect(
    page.getByRole("status").filter({ hasText: "Pembayaran berhasil dicatat" })
  ).toBeVisible()
  await expect(page.getByText(/^Rp\s?3\.000$/)).toBeVisible()
  await expect.poll(() => contrastFailures(page)).toEqual([])
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  }
  expect(errors).toEqual([])
})

test("desktop smoothing yields to reduced motion and mobile keeps native touch scrolling", async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.setViewportSize({ width: 1440, height: 700 })
  await page.goto("/fines/new")
  await expect(page.locator("html")).toHaveClass(/lenis/)
  await expect(
    page.getByRole("heading", { name: "Catat kejadian", exact: true })
  ).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
    )
    .toBeGreaterThan(100)
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await page.mouse.move(1400, 300)
  await page.mouse.wheel(0, 500)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100)
  await page.emulateMedia({ reducedMotion: "reduce" })
  await expect(page.locator("html")).not.toHaveClass(/lenis/)
  const mobile = await browser.newContext({
    baseURL: "http://localhost:3100",
    storageState: "/tmp/catat-denda-master-qa-session.json",
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: "no-preference",
  })
  try {
    const touchPage = await mobile.newPage()
    await touchPage.goto("/dashboard")
    await expect(
      touchPage.getByRole("navigation", { name: "Navigasi mobile" })
    ).toBeVisible()
    await expect(touchPage.locator("html")).not.toHaveClass(/lenis/)
    await touchPage.getByRole("button", { name: "Menu", exact: true }).click()
    await expect(touchPage.getByRole("dialog")).toBeVisible()
    await touchPage.getByRole("button", { name: "Tutup", exact: true }).click()
    await expect(touchPage.getByRole("dialog")).toBeHidden()
  } finally {
    await mobile.close()
  }
})
