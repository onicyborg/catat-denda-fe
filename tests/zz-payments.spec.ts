import { openPanel } from "./helpers/disclosure"
import { revealControl } from "./helpers/disclosure"
import { test, expect, type Page } from "@playwright/test"
import { contrastFailures } from "./helpers/contrast"
test.use({ storageState: "/tmp/catat-denda-master-qa-session.json" })
async function fixture(page: Page, suffix: string) {
  const me = (await (await page.request.get("/api/v1/auth/me")).json()).data
  const headers = {
    Origin: "http://localhost:3100",
    "X-CSRF-Token": me.csrfToken,
  }
  const create = async (path: string, data: object) => {
    const res = await page.request.post("/api/v1/" + path, {
      headers: { ...headers, "Idempotency-Key": crypto.randomUUID() },
      data,
    })
    expect(res.status()).toBe(201)
    return (await res.json()).data
  }
  const employee = await create("employees", {
      displayName: "Ledger User " + suffix,
      employeeCode: "LP-" + suffix,
    }),
    type = await create("violation-types", {
      code: "LP-" + suffix,
      name: "Ledger Type " + suffix,
      category: "OTHER",
      defaultAmountPerPerson: 5000,
    })
  let fine = await create("fine-cases", {
    occurredAt: "2026-01-01T01:00:00Z",
    violationTypeId: type.id,
    description: "Ledger browser " + suffix,
    members: [{ employeeId: employee.id, assignedAmount: 5000 }],
  })
  fine = await create(`fine-cases/${fine.id}/post`, { version: 1 })
  return { fine, member: fine.members[0], employee, headers, create }
}
async function openPayment(page: Page) {
  await page
    .getByRole("button", { name: "Catat pembayaran", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toBeVisible()
}
async function reversePayment(page: Page, reason: string, date: string) {
  await page
    .getByRole("button", { name: "Balikkan pembayaran", exact: true })
    .click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Alasan pembalikan").fill(reason)
  await dialog.getByLabel("Tanggal pembalikan (WIB)").fill(date)
  await dialog.getByRole("button", { name: "Konfirmasi pembalikan" }).click()
  await expect(dialog).toBeHidden()
}
const noOverflow = async (page: Page) => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
  for (const dialog of await page.getByRole("dialog").all())
    expect(
      await dialog.evaluate(
        (el) =>
          el.scrollWidth <= el.clientWidth + 1 &&
          el.getBoundingClientRect().right <= innerWidth &&
          el.getBoundingClientRect().left >= 0
      )
    ).toBe(true)
}
test("partial/full payment, metadata, reversals, history filters and void from UI", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  const { fine, employee } = await fixture(page, "FLOW")
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  )
  await page.goto("/fines/" + fine.id)
  const trigger = page.getByRole("button", {
    name: "Catat pembayaran",
    exact: true,
  })
  await trigger.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(trigger).toBeFocused()
  await openPayment(page)
  let dialog = page.getByRole("dialog")
  await expect(dialog.getByLabel("Nominal pembayaran (Rp)")).toHaveValue("5000")
  await dialog.getByLabel("Nominal pembayaran (Rp)").fill("1.5")
  await dialog
    .getByRole("button", { name: "Simpan pembayaran", exact: true })
    .click()
  await expect(dialog.getByRole("alert")).toContainText("nominal bulat")
  await dialog.getByLabel("Nominal pembayaran (Rp)").fill("2000")
  await expect(dialog.getByRole("status")).toContainText(/Rp\s?3\.000/)
  await dialog.getByLabel("Tanggal pembayaran (WIB)").fill("2026-01-02T08:30")
  await openPanel(page, "Tambah catatan")
  await dialog
    .getByLabel("Catatan pembayaran (opsional)")
    .fill("Pembayaran pertama QA")
  expect(await contrastFailures(page)).toEqual([])
  await page.screenshot({
    path: "/tmp/catat-denda-phase4-payment-desktop.png",
    fullPage: true,
  })
  await noOverflow(page)
  await page.setViewportSize({ width: 320, height: 850 })
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  )
  await noOverflow(page)
  await page.screenshot({
    path: "/tmp/catat-denda-phase4-payment-mobile.png",
    fullPage: true,
  })
  await dialog
    .getByRole("button", { name: "Simpan pembayaran", exact: true })
    .click()
  await expect(dialog).toBeHidden()
  await expect(
    page.getByText("Status pembayaran: Dibayar sebagian")
  ).toBeVisible()
  await expect(page.getByText(/^Sisa Rp\s?3\.000$/)).toBeVisible()
  await openPayment(page)
  dialog = page.getByRole("dialog")
  await expect(dialog.getByLabel("Nominal pembayaran (Rp)")).toHaveValue("3000")
  await dialog.getByLabel("Nominal pembayaran (Rp)").fill("4000")
  await dialog
    .getByRole("button", { name: "Simpan pembayaran", exact: true })
    .click()
  await expect(dialog.getByRole("alert")).toContainText("melebihi sisa")
  await dialog.getByLabel("Nominal pembayaran (Rp)").fill("3000")
  await dialog.getByLabel("Metode pembayaran").selectOption("TRANSFER")
  await dialog.getByLabel("Tanggal pembayaran (WIB)").fill("2026-01-02T09:30")
  await openPanel(page, "Tambah catatan")
  await dialog
    .getByLabel("Catatan pembayaran (opsional)")
    .fill("Pembayaran kedua QA")
  await dialog
    .getByRole("button", { name: "Simpan pembayaran", exact: true })
    .click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText("Status pembayaran: Lunas")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Catat pembayaran", exact: true })
  ).toBeHidden()
  await expect(
    page.getByRole("button", { name: "Batalkan kejadian", exact: true })
  ).toBeDisabled()
  await page.getByText("Riwayat pembayaran (2)", { exact: true }).click()
  await page
    .getByRole("link", { name: "Detail transaksi", exact: true })
    .first()
    .click()
  await expect(
    page.getByRole("heading", { name: "Detail pembayaran" })
  ).toBeVisible()
  await expect(
    page.getByRole("main").getByText(/^master\.browser/)
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Balikkan pembayaran", exact: true })
    .click()
  dialog = page.getByRole("dialog")
  await dialog.getByLabel("Alasan pembalikan").fill("abc")
  await dialog.getByRole("button", { name: "Konfirmasi pembalikan" }).click()
  await expect(dialog.getByRole("alert")).toContainText("minimal 5")
  await dialog.getByLabel("Alasan pembalikan").fill("Pembayaran pertama keliru")
  await dialog.getByLabel("Tanggal pembalikan (WIB)").fill("2026-01-01T08:30")
  await dialog.getByRole("button", { name: "Konfirmasi pembalikan" }).click()
  await expect(dialog.getByRole("alert")).toContainText(
    "sesudah pembayaran asli"
  )
  await expect(dialog.getByLabel("Alasan pembalikan")).toHaveValue(
    "Pembayaran pertama keliru"
  )
  await dialog.getByLabel("Tanggal pembalikan (WIB)").fill("2026-01-03T08:30")
  await dialog.getByRole("button", { name: "Konfirmasi pembalikan" }).click()
  await expect(dialog).toBeHidden()
  await expect(
    page.getByRole("button", { name: "Balikkan pembayaran", exact: true })
  ).toBeHidden()
  await page
    .getByRole("link", { name: "Lihat entri pembalikan", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Detail pembalikan" })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Lihat pembayaran asli" })
  ).toBeVisible()
  await expect(
    page.getByText("Pembayaran pertama keliru", { exact: true })
  ).toBeVisible()
  await page.goto("/payments")
  await openPanel(page, "Filter pembayaran")
  await page.getByRole("button", { name: "Filter karyawan" }).click()
  dialog = page.getByRole("dialog")
  await dialog.getByLabel("Cari pilihan").fill(employee.displayName)
  await dialog
    .getByRole("button", { name: new RegExp(employee.displayName) })
    .click()
  await revealControl(page, "Jenis transaksi")
  await page.getByLabel("Jenis transaksi").selectOption("PAYMENT")
  await page.getByRole("button", { name: "Terapkan filter" }).click()
  const second = page
    .locator("article")
    .filter({ hasText: "Pembayaran kedua QA" })
  await second.getByRole("link").click()
  await reversePayment(page, "Pembayaran kedua keliru", "2026-01-04T08:30")
  await page.goto("/fines/" + fine.id)
  await expect(page.getByText("Status pembayaran: Belum dibayar")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Ubah catatan", exact: true })
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Batalkan kejadian", exact: true })
    .click()
  await revealControl(page, "Alasan pembatalan")
  await page
    .getByLabel("Alasan pembatalan")
    .fill("Seluruh pembayaran telah dibalik")
  await page.getByRole("button", { name: "Konfirmasi pembatalan" }).click()
  await expect(
    page.getByText("Alasan pembatalan: Seluruh pembayaran telah dibalik")
  ).toBeVisible()
  await page.goto("/payments")
  await openPanel(page, "Filter pembayaran")
  await revealControl(page, "Dari tanggal efektif (WIB)")
  await page.getByLabel("Dari tanggal efektif (WIB)").fill("2026-01-03")
  await revealControl(page, "Sampai tanggal efektif (WIB)")
  await page.getByLabel("Sampai tanggal efektif (WIB)").fill("2026-01-04")
  await revealControl(page, "Jenis transaksi")
  await page.getByLabel("Jenis transaksi").selectOption("REVERSAL")
  await page.getByRole("button", { name: "Terapkan filter" }).click()
  await expect(page.locator("article")).toHaveCount(2)
  await noOverflow(page)
  expect(await contrastFailures(page)).toEqual([])
  await page.screenshot({
    path: "/tmp/catat-denda-phase4-history-mobile.png",
    fullPage: true,
  })
  expect(errors).toEqual([])
})
test("network failures retain original payment/reversal key and locked payload across dialog reopen", async ({
  page,
}) => {
  const { fine, member } = await fixture(page, "RETRY")
  await page.goto("/fines/" + fine.id)
  let firstKey = "",
    paymentId = "",
    paymentCalls = 0
  await page.route(
    `**/api/v1/fine-members/${member.id}/payments`,
    async (route) => {
      paymentCalls++
      if (paymentCalls === 1) {
        firstKey = route.request().headers()["idempotency-key"]
        const response = await route.fetch()
        expect(response.status()).toBe(201)
        paymentId = (await response.json()).data.id
        await route.abort()
      } else {
        expect(route.request().headers()["idempotency-key"]).toBe(firstKey)
        await route.continue()
      }
    }
  )
  await openPayment(page)
  let dialog = page.getByRole("dialog")
  await dialog.getByLabel("Nominal pembayaran (Rp)").fill("2000")
  await dialog
    .getByRole("button", { name: "Simpan pembayaran", exact: true })
    .click()
  await expect(dialog.getByRole("alert")).toContainText("Layanan")
  await expect(dialog.getByLabel("Nominal pembayaran (Rp)")).toBeDisabled()
  await dialog.getByRole("button", { name: "Tutup form", exact: true }).click()
  await page.getByRole("button", { name: "Lanjutkan konfirmasi" }).click()
  dialog = page.getByRole("dialog")
  await expect(dialog.getByLabel("Nominal pembayaran (Rp)")).toHaveValue("2000")
  await dialog.getByRole("button", { name: "Coba konfirmasi lagi" }).click()
  await expect(dialog).toBeHidden()
  await expect(
    page.getByText("Status pembayaran: Dibayar sebagian")
  ).toBeVisible()
  expect(paymentCalls).toBe(2)
  const loaded = (
    await (await page.request.get("/api/v1/fine-cases/" + fine.id)).json()
  ).data
  expect(loaded.members[0].entries).toHaveLength(1)
  expect(loaded.netPaidAmount).toBe("2000")
  await page.goto("/payments/" + paymentId)
  let reverseKey = "",
    reversalCalls = 0
  await page.route(`**/api/v1/payments/${paymentId}/reverse`, async (route) => {
    reversalCalls++
    if (reversalCalls === 1) {
      reverseKey = route.request().headers()["idempotency-key"]
      const response = await route.fetch()
      expect(response.status()).toBe(201)
      await route.abort()
    } else {
      expect(route.request().headers()["idempotency-key"]).toBe(reverseKey)
      await route.continue()
    }
  })
  await page
    .getByRole("button", { name: "Balikkan pembayaran", exact: true })
    .click()
  dialog = page.getByRole("dialog")
  await dialog
    .getByLabel("Alasan pembalikan")
    .fill("Respons terputus saat pembalikan")
  await dialog.getByRole("button", { name: "Konfirmasi pembalikan" }).click()
  await expect(dialog.getByRole("alert")).toContainText("Layanan")
  await expect(dialog.getByLabel("Alasan pembalikan")).toBeDisabled()
  await dialog.getByRole("button", { name: "Coba konfirmasi lagi" }).click()
  await expect(dialog).toBeHidden()
  expect(reversalCalls).toBe(2)
  const final = (
    await (await page.request.get("/api/v1/fine-cases/" + fine.id)).json()
  ).data
  expect(final.members[0].entries).toHaveLength(2)
  expect(final.netPaidAmount).toBe("0")
  expect(firstKey).not.toBe(reverseKey)
})
test("simultaneous payment forms cannot overpay and losing form preserves input", async ({
  page,
  context,
}) => {
  const { fine } = await fixture(page, "RACE")
  const other = await context.newPage()
  await Promise.all([
    page.goto("/fines/" + fine.id),
    other.goto("/fines/" + fine.id),
  ])
  for (const p of [page, other]) {
    await openPayment(p)
    await p.getByLabel("Nominal pembayaran (Rp)").fill("4000")
  }
  await Promise.all([
    page
      .getByRole("button", { name: "Simpan pembayaran", exact: true })
      .click(),
    other
      .getByRole("button", { name: "Simpan pembayaran", exact: true })
      .click(),
  ])
  await expect
    .poll(async () => {
      const c = (
        await (await page.request.get("/api/v1/fine-cases/" + fine.id)).json()
      ).data
      return c.netPaidAmount
    })
    .toBe("4000")
  const loser = (await page.getByRole("dialog").isVisible()) ? page : other
  await expect(loser.getByRole("dialog").getByRole("alert")).toContainText(
    "melebihi sisa"
  )
  await expect(loser.getByLabel("Nominal pembayaran (Rp)")).toHaveValue("4000")
  await loser.getByRole("button", { name: "Muat saldo terbaru" }).click()
  await openPayment(loser)
  await expect(loser.getByLabel("Nominal pembayaran (Rp)")).toHaveValue("1000")
  await other.close()
})
test("payment ledger pagination, effective-date filters, empty/error recovery, dark theme and detail", async ({
  page,
}) => {
  const { member, employee, create } = await fixture(page, "PAGES")
  for (let i = 0; i < 21; i++)
    await create(`fine-members/${member.id}/payments`, {
      amount: 1,
      method: i % 2 ? "TRANSFER" : "OTHER",
      effectiveAt: "2026-01-02T00:00:00+07:00",
      note: "Page transaction " + i,
    })
  let fail = true
  await page.route("**/api/v1/payments?**", async (route) => {
    if (fail) await route.abort()
    else await route.continue()
  })
  await page.goto("/payments")
  await openPanel(page, "Filter pembayaran")
  await expect(
    page.getByRole("alert").filter({ hasText: "Layanan" })
  ).toBeVisible()
  fail = false
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click()
  await expect(page.locator("article").first()).toBeVisible()
  await page.getByRole("button", { name: "Filter karyawan" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Cari pilihan").fill(employee.displayName)
  await dialog
    .getByRole("button", { name: new RegExp(employee.displayName) })
    .click()
  await page.getByRole("button", { name: "Terapkan filter" }).click()
  await expect(page.locator("article")).toHaveCount(20)
  await expect(page.getByText("21 data · Halaman 1 dari 2")).toBeVisible()
  await page.getByRole("button", { name: "Berikutnya", exact: true }).click()
  await expect(page.locator("article")).toHaveCount(1)
  await page.getByRole("button", { name: "Sebelumnya", exact: true }).click()
  await expect(page.locator("article")).toHaveCount(20)
  await revealControl(page, "Sampai tanggal efektif (WIB)")
  await page.getByLabel("Sampai tanggal efektif (WIB)").fill("2026-01-01")
  await page.getByRole("button", { name: "Terapkan filter" }).click()
  await expect(
    page.getByText("Belum ada transaksi yang sesuai.", { exact: false })
  ).toBeVisible()
  await page.getByRole("button", { name: "Reset filter" }).click()
  await expect(page.locator("article").first()).toBeVisible()
  await page.evaluate(() => localStorage.setItem("theme", "dark"))
  await page.reload()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(page.locator("article").first()).toBeVisible()
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 })
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    )
    await noOverflow(page)
  }
  expect(await contrastFailures(page)).toEqual([])
  await page.screenshot({
    path: "/tmp/catat-denda-phase4-history-dark-desktop.png",
    fullPage: true,
  })
  await page.locator("article").first().getByRole("link").click()
  await expect(
    page.getByRole("heading", { name: "Detail pembayaran" })
  ).toBeVisible()
  await noOverflow(page)
  expect(await contrastFailures(page)).toEqual([])
})
