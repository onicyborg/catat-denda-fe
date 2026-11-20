import { test, expect, type Page } from "@playwright/test"
import { readFile } from "node:fs/promises"
import { contrastFailures } from "./helpers/contrast"
import type { Employee } from "@/lib/master"
test.use({ storageState: "/tmp/catat-denda-master-qa-session.json" })
async function fixture(page: Page, suffix: string) {
  const me = (await (await page.request.get("/api/v1/auth/me")).json()).data,
    headers = { Origin: "http://localhost:3100", "X-CSRF-Token": me.csrfToken }
  const create = async (path: string, data: object) => {
    const r = await page.request.post("/api/v1/" + path, {
      headers: { ...headers, "Idempotency-Key": crypto.randomUUID() },
      data,
    })
    expect(r.status()).toBe(201)
    return (await r.json()).data
  }
  const employees: Employee[] = []
  for (let i = 0; i < 4; i++)
    employees.push(
      await create("employees", {
        displayName: `Report ${suffix} Person ${i}`,
        employeeCode: `R${i}-${suffix}`,
      })
    )
  const type = await create("violation-types", {
    code: "RT-" + suffix,
    name: "Report Type " + suffix,
    category: "OTHER",
    defaultAmountPerPerson: 5000,
  })
  let fine = await create("fine-cases", {
    occurredAt: "2026-01-01T00:00:00+07:00",
    violationTypeId: type.id,
    description: '=A1+B1,"quoted"\nReport QA',
    members: employees.map((e) => ({ employeeId: e.id, assignedAmount: 5000 })),
  })
  fine = await create(`fine-cases/${fine.id}/post`, { version: 1 })
  const member = fine.members.find(
    (m: { employeeId: string }) => m.employeeId === employees[0].id
  )
  const payment = await create(`fine-members/${member.id}/payments`, {
    amount: 2000,
    method: "CASH",
    effectiveAt: "2026-02-01T00:00:00+07:00",
  })
  await create(`fine-members/${member.id}/payments`, {
    amount: 1000,
    method: "TRANSFER",
    effectiveAt: "2026-02-02T00:00:00+07:00",
  })
  await create(`payments/${payment.id}/reverse`, {
    reason: "Report reversal QA",
    effectiveAt: "2026-03-01T00:00:00+07:00",
  })
  await create("fine-cases", {
    violationTypeId: type.id,
    description: "Draft reporting " + suffix,
  })
  return { employees, type, fine, headers, me, create }
}
const metric = (page: Page, label: string) =>
  page.getByText(label, { exact: true }).locator("..").getByRole("definition")
async function period(page: Page, from: string, to: string) {
  await page.getByLabel("Dari tanggal (WIB)", { exact: true }).fill(from)
  await page.getByLabel("Sampai tanggal (WIB)", { exact: true }).fill(to)
  await page
    .getByRole("button", { name: "Terapkan periode", exact: true })
    .click()
}
async function downloaded(page: Page, button: string) {
  const event = page.waitForEvent("download")
  await page.getByRole("button", { name: button, exact: true }).click()
  const download = await event
  const path = await download.path()
  expect(path).toBeTruthy()
  return {
    name: download.suggestedFilename(),
    text: await readFile(path!, "utf8"),
  }
}
const noOverflow = async (page: Page) => {
  const check = await page.evaluate(() => ({
    ok: document.documentElement.scrollWidth <= innerWidth,
    offenders: [...document.querySelectorAll("body *")]
      .filter((e) => {
        const r = e.getBoundingClientRect()
        return r.width > 0 && r.right > innerWidth + 1
      })
      .slice(0, 8)
      .map((e) => ({
        tag: e.tagName,
        text: e.textContent?.slice(0, 60),
        class: e.className,
      })),
  }))
  expect(check.ok, JSON.stringify(check.offenders)).toBe(true)
}
test("CSV export waits for the applied filter navigation", async ({ page }) => {
  await page.goto("/reports")
  await expect(
    page.getByRole("heading", { name: "Laporan", exact: true })
  ).toBeVisible()
  let release!: () => void
  let intercepted!: () => void
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  const seen = new Promise<void>((resolve) => {
    intercepted = resolve
  })
  await page.route("**/reports?**", async (route) => {
    intercepted()
    await held
    await route.continue()
  })
  try {
    await period(page, "2030-01-01", "2031-12-31")
    await seen
    await expect(
      page.getByRole("button", { name: "Unduh CSV kejadian", exact: true })
    ).toBeDisabled()
    await expect(
      page.getByRole("button", { name: "Unduh CSV pembayaran", exact: true })
    ).toBeDisabled()
    release()
    await expect(page).toHaveURL(/from=2030-01-01/)
    await page
      .getByRole("button", { name: "Unduh CSV kejadian", exact: true })
      .click()
    await expect(
      page.getByRole("alert").filter({ hasText: "Rentang ekspor maksimal" })
    ).toBeVisible()
  } finally {
    release()
    await page.unroute("**/reports?**")
  }
})
test("reports distinguish cohort, period cashflow, selected allocations, CSV and employee history", async ({
  page,
}) => {
  const { employees, type, fine } = await fixture(page, "COHORT")
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(
    `/reports?from=2026-01-01&to=2026-01-31&violationTypeId=${type.id}`
  )
  await expect(metric(page, "Kejadian diposting pada periode")).toHaveText("1")
  await expect(metric(page, "Alokasi kejadian pada periode")).toHaveText(
    /Rp\s?20\.000/
  )
  await expect(metric(page, "Pembayaran bersih pada periode")).toHaveText(
    /Rp\s?0/
  )
  await expect(metric(page, "Sisa seluruh kejadian saat ini")).toHaveText(
    /Rp\s?19\.000/
  )
  await expect(
    page.getByRole("link", { name: fine.displayCode, exact: true })
  ).toHaveCount(1)
  await page
    .getByRole("button", { name: "Filter karyawan", exact: true })
    .click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Cari pilihan").fill(employees[0].displayName)
  await dialog
    .getByRole("button", { name: new RegExp(employees[0].displayName) })
    .click()
  await page
    .getByRole("button", { name: "Terapkan periode", exact: true })
    .click()
  await expect(metric(page, "Alokasi kejadian pada periode")).toHaveText(
    /Rp\s?5\.000/
  )
  await expect(metric(page, "Sisa seluruh kejadian saat ini")).toHaveText(
    /Rp\s?4\.000/
  )
  await expect(page).toHaveURL(new RegExp("employeeId=" + employees[0].id))
  await page.reload()
  await expect(metric(page, "Alokasi kejadian pada periode")).toHaveText(
    /Rp\s?5\.000/
  )
  const csv = await downloaded(page, "Unduh CSV kejadian")
  expect(csv.name).toBe("fine-cases_2026-01-01_2026-01-31.csv")
  expect(csv.text).toContain("5000,1000,4000")
  expect(csv.text).toContain('"\'=A1+B1,""quoted""\nReport QA"')
  await noOverflow(page)
  expect(await contrastFailures(page)).toEqual([])
  await page.screenshot({
    path: "/tmp/catat-denda-phase5-reports-desktop.png",
    fullPage: true,
  })
  await period(page, "2026-03-01", "2026-03-31")
  await expect(metric(page, "Pembayaran bersih pada periode")).toHaveText(
    /-Rp\s?2\.000/
  )
  await expect(metric(page, "Sisa seluruh kejadian saat ini")).toHaveText(
    /Rp\s?4\.000/
  )
  await page
    .getByLabel("Jenis entri pada CSV pembayaran")
    .selectOption("REVERSAL")
  const ledger = await downloaded(page, "Unduh CSV pembayaran")
  expect(ledger.text).toContain(",2000,-2000,")
  await expect(
    page.getByText("Tidak ada kejadian sesuai filter.", { exact: true })
  ).toBeVisible()
  await period(page, "2020-01-01", "2026-12-31")
  await page
    .getByRole("button", { name: "Unduh CSV kejadian", exact: true })
    .click()
  await expect(
    page.getByRole("alert").filter({ hasText: "Rentang ekspor maksimal" })
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Semua karyawan", exact: true })
    .click()
  await page.getByLabel("Status daftar dan CSV kejadian").selectOption("DRAFT")
  await page
    .getByLabel("Sertakan kejadian tanpa tanggal pada daftar dan CSV")
    .check()
  await period(page, "2026-01-01", "2026-01-31")
  await expect(
    page.getByText("Draft reporting COHORT", { exact: true })
  ).toBeVisible()
  await expect(metric(page, "Alokasi kejadian pada periode")).toHaveText(
    /Rp\s?20\.000/
  )
  const emptyDraftCsv = await downloaded(page, "Unduh CSV kejadian")
  expect(emptyDraftCsv.text.split("\r\n").filter(Boolean)).toHaveLength(1)
  await page.getByRole("button", { name: "Semua jenis", exact: true }).click()
  await page
    .getByRole("button", { name: "Terapkan periode", exact: true })
    .click()
  await expect(page).not.toHaveURL(/violationTypeId=/)
  await page.goto(`/employees/${employees[0].id}?from=2026-01-01&to=2026-01-31`)
  await expect(
    page.getByRole("heading", { name: "Alokasi dan histori karyawan" })
  ).toBeVisible()
  await expect(metric(page, "Alokasi kejadian pada periode")).toHaveText(
    /Rp\s?5\.000/
  )
  await expect(
    page.getByRole("link", { name: fine.displayCode, exact: true })
  ).toHaveCount(1)
  await period(page, "2026-02-01", "2026-02-28")
  await expect(metric(page, "Pembayaran bersih pada periode")).toHaveText(
    /Rp\s?3\.000/
  )
  await expect(
    page.getByRole("link", {
      name: "Pembayaran · " + fine.displayCode,
      exact: true,
    })
  ).toHaveCount(2)
  await page.getByRole("button", { name: "Segarkan saldo karyawan" }).click()
  await expect(metric(page, "Sisa seluruh kejadian saat ini")).toHaveText(
    /Rp\s?4\.000/
  )
  expect(errors).toEqual([])
})
test("dashboard retries, honest cross-period labels, draft review and responsive themes", async ({
  page,
}) => {
  const { type } = await fixture(page, "DASH")
  let fail = true
  await page.route("**/api/v1/dashboard/summary?**", (r) =>
    fail ? r.abort() : r.continue()
  )
  await page.goto(
    `/dashboard?from=2026-01-01&to=2026-01-31&violationTypeId=${type.id}`
  )
  await expect(
    page.getByRole("alert").filter({ hasText: "Layanan" })
  ).toBeVisible()
  fail = false
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click()
  await expect(metric(page, "Alokasi kejadian pada periode")).toHaveText(
    /Rp\s?20\.000/
  )
  await expect(
    page.getByRole("heading", { name: "Draft perlu ditinjau (1)" })
  ).toBeVisible()
  await expect(
    page.getByText("Draft reporting DASH", { exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "Segarkan ringkasan" }).click()
  await expect(metric(page, "Sisa seluruh kejadian saat ini")).toHaveText(
    /Rp\s?19\.000/
  )
  await period(page, "2024-01-01", "2024-01-31")
  await expect(metric(page, "Kejadian diposting pada periode")).toHaveText("0")
  await expect(metric(page, "Sisa seluruh kejadian saat ini")).toHaveText(
    /Rp\s?19\.000/
  )
  await expect(
    page.getByRole("heading", { name: "Sisa terbesar saat ini" })
  ).toBeVisible()
  for (const width of [320, 360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await noOverflow(page)
  }
  expect(await contrastFailures(page)).toEqual([])
  await page.screenshot({
    path: "/tmp/catat-denda-phase5-dashboard-desktop.png",
    fullPage: true,
  })
  await page.evaluate(() => localStorage.setItem("theme", "dark"))
  await page.reload()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(metric(page, "Sisa seluruh kejadian saat ini")).toHaveText(
    /Rp\s?19\.000/
  )
  await page.setViewportSize({ width: 360, height: 900 })
  await noOverflow(page)
  expect(await contrastFailures(page)).toEqual([])
  await page.screenshot({
    path: "/tmp/catat-denda-phase5-dashboard-dark-mobile.png",
    fullPage: true,
  })
  await page
    .getByRole("button", { name: "Bulan berjalan", exact: true })
    .click()
  await expect(page).not.toHaveURL(/2024-01/)
})
test("audit actor/action/entity filters, payload details, paging and empty state", async ({
  page,
}) => {
  const me = (await (await page.request.get("/api/v1/auth/me")).json()).data
  await page.goto("/audit-logs")
  await expect(
    page.getByRole("heading", { name: "Audit log", exact: true })
  ).toBeVisible()
  await page.getByLabel("Aktor", { exact: true }).selectOption(me.id)
  await page
    .getByLabel("Aksi", { exact: true })
    .selectOption("EXPORT_FINE_CASES")
  await page.getByLabel("Entitas", { exact: true }).selectOption("ReportExport")
  await page.getByRole("button", { name: "Terapkan filter audit" }).click()
  await expect(page.locator("article").first()).toBeVisible()
  await expect(page).toHaveURL(/actorUserId=/)
  await page
    .locator("article")
    .first()
    .getByText("Detail audit", { exact: true })
    .click()
  await expect(
    page.locator("article").first().locator("pre").last()
  ).toContainText("rowCount")
  expect(await page.locator("main").innerText()).not.toContain("passwordHash")
  expect(await page.locator("main").innerText()).not.toContain("quoted")
  await page.reload()
  await expect(page.getByLabel("Aktor", { exact: true })).toHaveValue(me.id)
  await page.getByLabel("Dari waktu pencatatan (WIB)").fill("2020-01-01")
  await page.getByLabel("Sampai waktu pencatatan (WIB)").fill("2020-01-31")
  await page.getByRole("button", { name: "Terapkan filter audit" }).click()
  await expect(
    page.getByText("Tidak ada audit yang sesuai.", { exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "Reset filter audit" }).click()
  await expect(page.locator("article")).toHaveCount(20)
  await page.getByRole("button", { name: "Berikutnya", exact: true }).click()
  await expect(page.getByText(/Halaman 2 dari/)).toBeVisible()
  await page.getByRole("button", { name: "Sebelumnya", exact: true }).click()
  await page.getByRole("button", { name: "Segarkan audit" }).click()
  await expect(page.locator("article")).toHaveCount(20)
  await page
    .locator("article")
    .first()
    .getByText("Detail audit", { exact: true })
    .click()
  await noOverflow(page)
  expect(await contrastFailures(page)).toEqual([])
  await page.screenshot({
    path: "/tmp/catat-denda-phase5-audit-mobile.png",
    fullPage: true,
  })
})
test("business settings version conflict retains edits and updates brand and reports", async ({
  page,
  context,
}) => {
  const me = (await (await page.request.get("/api/v1/auth/me")).json()).data,
    headers = { Origin: "http://localhost:3100", "X-CSRF-Token": me.csrfToken }
  await page.goto("/settings")
  const other = await context.newPage()
  await other.goto("/settings")
  await page.getByLabel("Nama usaha", { exact: true }).fill("X")
  await page.getByRole("button", { name: "Simpan pengaturan usaha" }).click()
  await expect(
    page.getByRole("alert").filter({ hasText: "minimal 2" })
  ).toBeVisible()
  await page.getByLabel("Nama usaha", { exact: true }).fill("Usaha Pagi QA")
  await page
    .getByLabel("Referensi kebijakan denda (opsional)")
    .fill("Kebijakan internal QA")
  await other
    .getByLabel("Nama usaha", { exact: true })
    .fill("Usaha tab lama QA")
  await page.getByRole("button", { name: "Simpan pengaturan usaha" }).click()
  await expect(
    page.getByText("Pengaturan usaha berhasil disimpan.", { exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Usaha Pagi QA", exact: true })
  ).toBeVisible()
  await other.getByRole("button", { name: "Simpan pengaturan usaha" }).click()
  await expect(
    other.getByRole("alert").filter({ hasText: "sudah berubah" })
  ).toBeVisible()
  await expect(other.getByLabel("Nama usaha", { exact: true })).toHaveValue(
    "Usaha tab lama QA"
  )
  await other.getByRole("button", { name: "Muat pengaturan terbaru" }).click()
  await expect(other.getByLabel("Nama usaha", { exact: true })).toHaveValue(
    "Usaha Pagi QA"
  )
  const longName = "Usaha " + "X".repeat(144)
  await page.getByLabel("Nama usaha", { exact: true }).fill(longName)
  await page.getByRole("button", { name: "Simpan pengaturan usaha" }).click()
  await expect(
    page.getByRole("link", { name: longName, exact: true })
  ).toBeVisible()
  await page.setViewportSize({ width: 320, height: 900 })
  await noOverflow(page)
  await page.screenshot({
    path: "/tmp/catat-denda-phase5-settings-mobile.png",
    fullPage: true,
  })
  await page.goto("/reports?from=2026-01-01&to=2026-01-31")
  await expect(
    page.getByRole("link", { name: longName, exact: true })
  ).toBeVisible()
  await expect(page.getByText(longName, { exact: true }).last()).toBeVisible()
  await noOverflow(page)
  await page.getByRole("button", { name: "Segarkan laporan" }).click()
  await expect(metric(page, "Kejadian diposting pada periode")).toBeVisible()
  const saved = (await (await page.request.get("/api/v1/settings")).json()).data
  expect(
    (
      await page.request.patch("/api/v1/settings", {
        headers,
        data: {
          businessName: "Catat Denda",
          finePolicyReference: null,
          version: saved.version,
        },
      })
    ).status()
  ).toBe(200)
  await other.close()
})
