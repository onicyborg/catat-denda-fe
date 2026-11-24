import { openPanel } from "./helpers/disclosure"
import { revealControl } from "./helpers/disclosure"
import { contrastFailures } from "./helpers/contrast"
import { test, expect, type Page } from "@playwright/test"
test.use({ storageState: "/tmp/catat-denda-master-qa-session.json" })
async function seed(page: Page, suffix: string) {
  const me = await (await page.request.get("/api/v1/auth/me")).json()
  const headers = {
    "X-CSRF-Token": me.data.csrfToken,
    Origin: "http://localhost:3100",
  }
  const create = async (path: string, data: object) => {
    const res = await page.request.post("/api/v1/" + path, { headers, data })
    expect(res.status()).toBe(201)
    return (await res.json()).data
  }
  const a = await create("employees", {
      displayName: `Fine Alice ${suffix}`,
      employeeCode: `FA-${suffix}`,
    }),
    b = await create("employees", {
      displayName: `Fine Bob ${suffix}`,
      employeeCode: `FB-${suffix}`,
    })
  const t = await create("violation-types", {
    code: `FT-${suffix}`,
    name: `Fine Type ${suffix}`,
    category: "OTHER",
    defaultAmountPerPerson: 5000,
  })
  const t2 = await create("violation-types", {
    code: `FX-${suffix}`,
    name: `Fine Alternative ${suffix}`,
    category: "ORDER",
    defaultAmountPerPerson: 7000,
  })
  return { a, b, t, t2, headers }
}
async function chooseType(page: Page, name: string) {
  await page
    .getByRole("button", { name: /Pilih jenis kesalahan|FT-|FX-/ })
    .click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Cari pilihan").fill(name)
  await dialog.getByRole("button", { name: new RegExp(name) }).click()
  await expect(dialog).toBeHidden()
}
async function choosePeople(page: Page, names: string[]) {
  await page
    .getByRole("button", { name: "Pilih karyawan", exact: true })
    .click()
  const dialog = page.getByRole("dialog")
  for (const name of names) {
    await dialog.getByLabel("Cari pilihan").fill(name)
    await dialog.getByRole("button", { name: new RegExp(name) }).click()
  }
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
}
const noOverflow = async (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    )
    .toBe(true)
test("fine allocations, default/manual rates, posting, correction, filters and void on mobile", async ({
  page,
}) => {
  const pageErrors: string[] = []
  page.on("pageerror", (error) => pageErrors.push(error.message))
  const { a, b, t, t2 } = await seed(page, "FLOW")
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  )
  await page.goto("/fines/new")
  await revealControl(page, "Deskripsi kejadian")
  await page
    .getByLabel("Deskripsi kejadian", { exact: true })
    .fill("Kesalahan pesanan browser QA")
  await chooseType(page, t.name)
  await choosePeople(page, [a.displayName, b.displayName])
  await expect(page.getByLabel("Nominal peserta 1 (Rp)")).toHaveValue("5000")
  await expect(
    page.getByRole("status").filter({ hasText: "Tarif jenis baru" })
  ).toBeVisible()
  await revealControl(page, "Nominal peserta 1 (Rp)")
  await page.getByLabel("Nominal peserta 1 (Rp)").fill("3000")
  await chooseType(page, t2.name)
  await expect(page.getByLabel("Nominal peserta 1 (Rp)")).toHaveValue("3000")
  await expect(page.getByLabel("Nominal peserta 2 (Rp)")).toHaveValue("7000")
  await noOverflow(page)
  expect(await contrastFailures(page)).toEqual([])
  await page.screenshot({
    path: "/tmp/catat-denda-phase3-form-desktop.png",
    fullPage: true,
  })
  await page.setViewportSize({ width: 320, height: 800 })
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  )
  await noOverflow(page)
  await page.screenshot({
    path: "/tmp/catat-denda-phase3-form-mobile.png",
    fullPage: true,
  })
  await page.getByRole("button", { name: "Simpan denda", exact: true }).click()
  await expect(page).toHaveURL(/\/fines\/[a-f0-9-]+$/)
  await expect(page.getByText("Status pembayaran: Belum dibayar")).toBeVisible()
  await expect(page.getByText(/^Rp\s?10\.000$/).first()).toBeVisible()
  await noOverflow(page)
  const url = page.url()
  await page.getByRole("button", { name: "Koreksi kejadian" }).click()
  await revealControl(page, "Nominal peserta 1 (Rp)")
  await page.getByLabel("Nominal peserta 1 (Rp)").fill("4000")
  await revealControl(page, "Nominal peserta 2 (Rp)")
  await page.getByLabel("Nominal peserta 2 (Rp)").fill("6000")
  await page.getByRole("button", { name: "Simpan koreksi" }).click()
  await expect(page.getByText("Perubahan berhasil disimpan.")).toBeVisible()
  await expect(page.getByText(/^Rp\s?4\.000$/)).toBeVisible()
  await page
    .getByRole("button", { name: "Batalkan kejadian", exact: true })
    .click()
  await revealControl(page, "Alasan pembatalan")
  await page.getByLabel("Alasan pembatalan").fill("Kejadian perlu dibatalkan")
  await page.getByRole("button", { name: "Konfirmasi pembatalan" }).click()
  await expect(
    page.getByText("Alasan pembatalan: Kejadian perlu dibatalkan")
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Koreksi kejadian" })
  ).toBeHidden()
  await page.getByRole("link", { name: "Kembali ke daftar kejadian" }).click()
  await revealControl(page, "Cari kode, deskripsi, atau peserta")
  await page
    .getByLabel("Cari kode, deskripsi, atau peserta")
    .fill("Kesalahan pesanan browser QA")
  await revealControl(page, "Status kejadian")
  await page
    .getByLabel("Status kejadian", { exact: true })
    .selectOption("VOIDED")
  await openPanel(page, "Filter denda")
  await page.getByRole("button", { name: "Terapkan filter" }).click()
  await expect(page.getByRole("link", { name: /DND-/ })).toHaveCount(1)
  await noOverflow(page)
  await page.screenshot({
    path: "/tmp/catat-denda-phase3-list-mobile.png",
    fullPage: true,
  })
  expect(pageErrors).toEqual([])
  await page.evaluate(() => localStorage.setItem("theme", "dark"))
  await page.goto(url)
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(
    page.getByText("Alasan pembatalan: Kejadian perlu dibatalkan")
  ).toBeVisible()
  expect(await contrastFailures(page)).toEqual([])
  await page.screenshot({
    path: "/tmp/catat-denda-phase3-detail-dark-mobile.png",
    fullPage: true,
  })
  await noOverflow(page)
})
test("incomplete draft survives failed posting and retries same draft", async ({
  page,
}) => {
  const { a, t } = await seed(page, "DRAFT")
  await page.goto("/fines/new")
  await openPanel(page, "Karyawan belum ada di daftar")
  await page
    .getByRole("button", { name: "Tambah nama dari sumber untuk draft" })
    .click()
  await revealControl(page, "Nama dari sumber 1")
  await page.getByLabel("Nama dari sumber 1").fill("Nama belum pasti")
  await revealControl(page, "Deskripsi kejadian")
  await page
    .getByLabel("Deskripsi kejadian", { exact: true })
    .fill("Draft untuk validasi posting")
  let creates = 0
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().endsWith("/fine-cases")) creates++
  })
  await page.getByRole("button", { name: "Simpan denda", exact: true }).click()
  await expect(
    page.getByRole("alert").filter({ hasText: /Layanan|Tanggal|jenis/ })
  ).toBeVisible()
  await expect(page.getByLabel("Nama dari sumber 1")).toHaveValue(
    "Nama belum pasti"
  )
  await expect(
    page.getByText("Draft tersimpan:", { exact: false })
  ).toBeVisible()
  expect(creates).toBe(1)
  await chooseType(page, t.name)
  await page.getByRole("button", { name: "Hubungkan karyawan" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Cari pilihan").fill(a.displayName)
  await dialog.getByRole("button", { name: new RegExp(a.displayName) }).click()
  await page.keyboard.press("Escape")
  await revealControl(page, "Nominal peserta 1 (Rp)")
  await page.getByLabel("Nominal peserta 1 (Rp)").fill("5000")
  await page.getByRole("button", { name: "Simpan denda", exact: true }).click()
  await expect(page).toHaveURL(/\/fines\/[a-f0-9-]+$/)
  expect(creates).toBe(1)
  await expect(page.getByText("Status pembayaran: Belum dibayar")).toBeVisible()
})
test("lost create response retries idempotently; stale edit retains input", async ({
  page,
}) => {
  const { a, t, headers } = await seed(page, "RETRY")
  await page.goto("/fines/new")
  await chooseType(page, t.name)
  await choosePeople(page, [a.displayName])
  await revealControl(page, "Deskripsi kejadian")
  await page
    .getByLabel("Deskripsi kejadian", { exact: true })
    .fill("Retry setelah koneksi putus")
  let lostId = "",
    firstKey = ""
  let intercepted = false
  await page.route("**/api/v1/fine-cases", async (route) => {
    if (route.request().method() === "POST" && !intercepted) {
      intercepted = true
      firstKey = route.request().headers()["idempotency-key"]
      const res = await route.fetch()
      expect(res.status()).toBe(201)
      lostId = (await res.json()).data.id
      await route.abort()
    } else await route.continue()
  })
  await page.getByRole("button", { name: "Simpan draft", exact: true }).click()
  await expect(
    page.getByRole("alert").filter({ hasText: /Layanan|Tanggal|jenis/ })
  ).toBeVisible()
  await revealControl(page, "Deskripsi kejadian")
  await page
    .getByLabel("Deskripsi kejadian", { exact: true })
    .fill("Retry dengan catatan terbaru")
  await page.getByRole("button", { name: "Simpan draft", exact: true }).click()
  await expect(page).toHaveURL(new RegExp(lostId + "$"))
  expect(firstKey).toBeTruthy()
  await expect(
    page.getByText("Retry dengan catatan terbaru", { exact: true })
  ).toBeVisible()
  const res = await page.request.get("/api/v1/fine-cases/" + lostId)
  const current = (await res.json()).data
  await page.getByRole("button", { name: "Lengkapi draft" }).click()
  await revealControl(page, "Deskripsi kejadian")
  await page
    .getByLabel("Deskripsi kejadian", { exact: true })
    .fill("Input lokal tidak boleh hilang")
  expect(
    (
      await page.request.patch("/api/v1/fine-cases/" + lostId, {
        headers,
        data: {
          version: current.version,
          description: "Perubahan dari tab lain",
        },
      })
    ).status()
  ).toBe(200)
  await page.getByRole("button", { name: "Simpan draft", exact: true }).click()
  await expect(
    page.getByRole("alert").filter({ hasText: "sudah berubah" })
  ).toBeVisible()
  await expect(
    page.getByLabel("Deskripsi kejadian", { exact: true })
  ).toHaveValue("Input lokal tidak boleh hilang")
  await page.getByRole("button", { name: "Batal mengubah" }).click()
  await expect(
    page.getByText("Perubahan dari tab lain", { exact: true })
  ).toBeVisible()
})

test("lost posting response recovers posted case without another transition", async ({
  page,
}) => {
  const { a, t } = await seed(page, "POSTLOSS")
  await page.goto("/fines/new")
  await chooseType(page, t.name)
  await choosePeople(page, [a.displayName])
  await revealControl(page, "Deskripsi kejadian")
  await page
    .getByLabel("Deskripsi kejadian", { exact: true })
    .fill("Posting dengan respons terputus")
  let id = "",
    posts = 0
  await page.route("**/api/v1/fine-cases/*/post", async (route) => {
    posts++
    const response = await route.fetch()
    expect(response.status()).toBe(201)
    id = (await response.json()).data.id
    await route.abort()
  })
  await page.getByRole("button", { name: "Simpan denda", exact: true }).click()
  await expect(
    page.getByRole("alert").filter({ hasText: "Layanan" })
  ).toBeVisible()
  await expect(
    page.getByLabel("Deskripsi kejadian", { exact: true })
  ).toHaveValue("Posting dengan respons terputus")
  await page.getByRole("button", { name: "Simpan denda", exact: true }).click()
  await expect(page).toHaveURL(new RegExp(id + "$"))
  expect(posts).toBe(1)
  await expect(page.getByText("Status pembayaran: Belum dibayar")).toBeVisible()
  const trigger = page.getByRole("button", {
    name: "Batalkan kejadian",
    exact: true,
  })
  await trigger.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toBeHidden()
  await expect(trigger).toBeFocused()
  let failRead = true
  await page.route("**/api/v1/fine-cases?**", async (route) => {
    if (failRead) await route.abort()
    else await route.continue()
  })
  await page.goto("/fines")
  await expect(
    page.getByRole("alert").filter({ hasText: "Layanan" })
  ).toBeVisible()
  failRead = false
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click()
  await expect(page.getByRole("link", { name: /DND-/ }).first()).toBeVisible()
  await revealControl(page, "Cari kode, deskripsi, atau peserta")
  await page
    .getByLabel("Cari kode, deskripsi, atau peserta")
    .fill("NOT-EXISTENT-INCIDENT-QA")
  await openPanel(page, "Filter denda")
  await page.getByRole("button", { name: "Terapkan filter" }).click()
  await expect(
    page.getByText("Belum ada kejadian yang sesuai.", { exact: false })
  ).toBeVisible()
  await page.getByRole("button", { name: "Reset filter" }).click()
  await expect(page.getByRole("link", { name: /DND-/ }).first()).toBeVisible()
})
