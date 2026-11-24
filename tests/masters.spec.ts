import { openPanel } from "./helpers/disclosure"
import { revealControl } from "./helpers/disclosure"
import { test, expect } from "@playwright/test"
test.use({ storageState: "/tmp/catat-denda-master-qa-session.json" })

test("employees, manual aliases, conflicting names, edit and archive", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  )
  await page.goto("/employees")
  await expect(
    page.getByRole("heading", { name: "Karyawan", exact: true })
  ).toBeVisible()
  await expect(
    page.getByText("Belum ada data yang sesuai.", { exact: false })
  ).toBeVisible()
  const add = async (name: string, code: string) => {
    await page
      .getByRole("button", { name: "Tambah karyawan", exact: true })
      .click()
    const form = page.getByRole("dialog")
    await form.getByLabel("Nama karyawan", { exact: true }).fill(name)
    await form
      .getByLabel("Kode karyawan (opsional)", { exact: true })
      .fill(code)
    await form
      .getByRole("button", { name: "Simpan karyawan", exact: true })
      .click()
    await expect(form).toBeHidden()
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible()
  }
  await add("El QA", "QA-EL")
  await add("Elvina QA", "QA-ELV")
  await page
    .getByRole("button", { name: "Tambah karyawan", exact: true })
    .click()
  const form = page.getByRole("dialog")
  await form.getByLabel("Nama karyawan", { exact: true }).fill("Duplicate QA")
  await form
    .getByLabel("Kode karyawan (opsional)", { exact: true })
    .fill("qa-el")
  await form
    .getByRole("button", { name: "Simpan karyawan", exact: true })
    .click()
  await expect(form.getByRole("alert")).toContainText("sudah digunakan")
  await expect(form.getByLabel("Nama karyawan", { exact: true })).toHaveValue(
    "Duplicate QA"
  )
  await page.keyboard.press("Escape")
  await expect(form).toBeHidden()
  await page.getByRole("link", { name: "El QA", exact: true }).click()
  await revealControl(page, "Alias baru")
  await page.getByLabel("Alias baru", { exact: true }).fill("el-satu")
  await page.getByRole("button", { name: "Tambah alias", exact: true }).click()
  await expect(page.getByText("el-satu", { exact: true })).toBeVisible()
  await revealControl(page, "Alias baru")
  await page.getByLabel("Alias baru", { exact: true }).fill("Elvina QA")
  await page.getByRole("button", { name: "Tambah alias", exact: true }).click()
  await expect(
    page.getByRole("alert").filter({ hasText: "nama utama karyawan lain" })
  ).toBeVisible()
  await expect(page.getByLabel("Alias baru", { exact: true })).toHaveValue(
    "Elvina QA"
  )
  await page.getByRole("link", { name: "Kembali ke daftar karyawan" }).click()
  await revealControl(page, "Cari nama, kode, atau alias")
  await page
    .getByLabel("Cari nama, kode, atau alias", { exact: true })
    .fill("el-satu")
  await page.getByRole("button", { name: "Cari", exact: true }).click()
  await expect(
    page.getByRole("link", { name: "El QA", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Elvina QA", exact: true })
  ).toHaveCount(0)
  await page.getByRole("link", { name: "El QA", exact: true }).click()
  await page.getByRole("button", { name: "Ubah profil", exact: true }).click()
  await page
    .getByRole("dialog")
    .getByLabel("Nama karyawan", { exact: true })
    .fill("El QA Updated")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Simpan karyawan", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "El QA Updated", exact: true })
  ).toBeVisible()
  await openPanel(page, "Nama panggilan karyawan")
  await page.getByRole("button", { name: "Hapus alias", exact: true }).click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Konfirmasi", exact: true })
    .click()
  await expect(
    page.getByText("Belum ada alias.", { exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "Arsipkan", exact: true }).click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Konfirmasi", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Aktifkan kembali", exact: true })
  ).toBeVisible()
  await page.getByRole("link", { name: "Kembali ke daftar karyawan" }).click()
  await revealControl(page, "Status")
  await page.getByLabel("Status", { exact: true }).selectOption("INACTIVE")
  await expect(
    page.getByRole("link", { name: "El QA Updated", exact: true })
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Aktifkan kembali", exact: true })
    .click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Konfirmasi", exact: true })
    .click()
  await expect(
    page.getByRole("link", { name: "El QA Updated", exact: true })
  ).toHaveCount(0)
  await revealControl(page, "Status")
  await page.getByLabel("Status", { exact: true }).selectOption("ACTIVE")
  await expect(
    page.getByRole("link", { name: "El QA Updated", exact: true })
  ).toBeVisible()
  await page.screenshot({
    path: "/tmp/catat-denda-employees.png",
    fullPage: true,
  })
})

test("mobile violation type validation, edit, filter and archive", async ({
  page,
}) => {
  await page.goto("/mistake-types")
  await page.getByRole("button", { name: "Menu", exact: true }).click()
  await expect(
    page
      .getByRole("dialog")
      .getByRole("link", { name: "Pembayaran", exact: true })
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await page
    .getByRole("button", { name: "Tambah jenis kesalahan", exact: true })
    .click()
  const form = page.getByRole("dialog")
  await form.getByLabel("Kode", { exact: true }).fill("qa-racikan")
  await form
    .getByLabel("Nama jenis kesalahan", { exact: true })
    .fill("Kesalahan Racikan QA")
  await form.getByLabel("Kategori", { exact: true }).selectOption("PREPARATION")
  await form
    .getByLabel("Tarif default per orang (Rp)", { exact: true })
    .fill("0")
  await form
    .getByRole("button", { name: "Simpan jenis kesalahan", exact: true })
    .click()
  await expect(form.getByRole("alert")).toContainText("minimal Rp1")
  await expect(
    form.getByLabel("Nama jenis kesalahan", { exact: true })
  ).toHaveValue("Kesalahan Racikan QA")
  await form
    .getByLabel("Tarif default per orang (Rp)", { exact: true })
    .fill("5000")
  await form
    .getByLabel("Deskripsi (opsional)", { exact: true })
    .fill("Deskripsi QA.")
  await form
    .getByRole("button", { name: "Simpan jenis kesalahan", exact: true })
    .click()
  await expect(form).toBeHidden()
  await expect(
    page.getByRole("heading", { name: "Kesalahan Racikan QA", exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "Ubah", exact: true }).click()
  await form
    .getByLabel("Tarif default per orang (Rp)", { exact: true })
    .fill("10000")
  await form
    .getByRole("button", { name: "Simpan jenis kesalahan", exact: true })
    .click()
  await expect(page.getByText(/10\.000/)).toBeVisible()
  await revealControl(page, "Kategori")
  await page.getByLabel("Kategori", { exact: true }).selectOption("OTHER")
  await expect(
    page.getByRole("heading", { name: "Kesalahan Racikan QA", exact: true })
  ).toHaveCount(0)
  await revealControl(page, "Kategori")
  await page.getByLabel("Kategori", { exact: true }).selectOption("PREPARATION")
  await expect(
    page.getByRole("heading", { name: "Kesalahan Racikan QA", exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "Arsipkan", exact: true }).click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Konfirmasi", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Kesalahan Racikan QA", exact: true })
  ).toHaveCount(0)
  await revealControl(page, "Status")
  await page.getByLabel("Status", { exact: true }).selectOption("INACTIVE")
  await page
    .getByRole("button", { name: "Aktifkan kembali", exact: true })
    .click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Konfirmasi", exact: true })
    .click()
  await revealControl(page, "Status")
  await page.getByLabel("Status", { exact: true }).selectOption("ACTIVE")
  await expect(
    page.getByRole("heading", { name: "Kesalahan Racikan QA", exact: true })
  ).toBeVisible()
  for (const width of [320, 360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBeTruthy()
  }
  await page.setViewportSize({ width: 360, height: 800 })
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  )
  await page.screenshot({
    path: "/tmp/catat-denda-master-types-mobile.png",
    fullPage: true,
  })
})

test("employee paging uses server total and keeps filters", async ({
  page,
  request,
}) => {
  const profile = await request.get("/api/v1/auth/me")
  expect(profile.ok()).toBeTruthy()
  const {
    data: { csrfToken },
  } = await profile.json()
  for (let i = 0; i < 21; i++) {
    const response = await request.post("/api/v1/employees", {
      headers: { Origin: "http://localhost:3100", "X-CSRF-Token": csrfToken },
      data: { displayName: `Pagination QA ${String(i).padStart(2, "0")}` },
    })
    expect(response.status()).toBe(201)
  }
  await page.goto("/employees")
  await revealControl(page, "Cari nama, kode, atau alias")
  await page
    .getByLabel("Cari nama, kode, atau alias", { exact: true })
    .fill("Pagination QA")
  await page.getByRole("button", { name: "Cari", exact: true }).click()
  await expect(page.getByRole("link", { name: /^Pagination QA / })).toHaveCount(
    20
  )
  await page.getByRole("button", { name: "Berikutnya", exact: true }).click()
  await expect(page.getByRole("link", { name: /^Pagination QA / })).toHaveCount(
    1
  )
  await expect(
    page.getByText("21 data · Halaman 2 dari 2", { exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "Sebelumnya", exact: true }).click()
  await expect(page.getByRole("link", { name: /^Pagination QA / })).toHaveCount(
    20
  )
})

test("master errors recover, dialogs support keyboard and long names reflow", async ({
  page,
  request,
}) => {
  await page.route("**/api/v1/employees**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: { message: "Gangguan QA sementara." } }),
    })
  )
  await page.goto("/employees")
  await expect(
    page.getByRole("alert").filter({ hasText: "Gangguan QA sementara." })
  ).toBeVisible()
  await revealControl(page, "Cari nama, kode, atau alias")
  await page
    .getByLabel("Cari nama, kode, atau alias", { exact: true })
    .fill("El")
  await page.unroute("**/api/v1/employees**")
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Coba lagi", exact: true })
  ).toHaveCount(0)
  await expect(
    page.getByLabel("Cari nama, kode, atau alias", { exact: true })
  ).toHaveValue("El")
  await page
    .getByRole("button", { name: "Tambah karyawan", exact: true })
    .click()
  await expect(
    page.getByRole("dialog").getByLabel("Nama karyawan", { exact: true })
  ).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toBeHidden()
  await expect(
    page.getByRole("button", { name: "Tambah karyawan", exact: true })
  ).toBeFocused()
  const profile = await request.get("/api/v1/auth/me")
  const {
    data: { csrfToken },
  } = await profile.json()
  const response = await request.post("/api/v1/employees", {
    headers: { Origin: "http://localhost:3100", "X-CSRF-Token": csrfToken },
    data: { displayName: "X".repeat(120), employeeCode: "QA-LONG" },
  })
  expect(response.status()).toBe(201)
  await page.setViewportSize({ width: 320, height: 800 })
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  )
  await revealControl(page, "Cari nama, kode, atau alias")
  await page
    .getByLabel("Cari nama, kode, atau alias", { exact: true })
    .fill("QA-LONG")
  await page.getByRole("button", { name: "Cari", exact: true }).click()
  await expect(
    page.getByRole("link", { name: "X".repeat(120), exact: true })
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBeTruthy()
  await page.getByRole("button", { name: "Arsipkan", exact: true }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBeTruthy()
  await page.getByRole("button", { name: "Batal", exact: true }).click()
  await page.emulateMedia({ colorScheme: "dark" })
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.goto("/employees/00000000-0000-4000-8000-000000000001")
  await expect(
    page.getByRole("alert").filter({ hasText: "Karyawan tidak ditemukan." })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Kembali ke daftar karyawan" })
  ).toBeVisible()
})
