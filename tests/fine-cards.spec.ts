import { test, expect, type Page } from "@playwright/test"
import { contrastFailures } from "./helpers/contrast"
import type { Fine } from "../lib/fines"

test.use({ storageState: "/tmp/catat-denda-master-qa-session.json" })
const suffix = `CARDS-${crypto.randomUUID().slice(0, 8)}`
const fixtures: Fine[] = []
test.beforeAll(async ({ request }) => {
  const me = (
    await (await request.get("http://localhost:3100/api/v1/auth/me")).json()
  ).data
  for (let index = 0; index < 13; index++) {
    const response = await request.post(
      "http://localhost:3100/api/v1/fine-cases",
      {
        headers: {
          Origin: "http://localhost:3100",
          "X-CSRF-Token": me.csrfToken,
          "Idempotency-Key": crypto.randomUUID(),
        },
        data: {
          description: `${suffix} kejadian ${String(index).padStart(2, "0")} ${index === 12 ? "rincian panjang ".repeat(12) : "catatan operasional"}`,
          // Creation order must win even when the incident date runs backwards.
          occurredAt: new Date(Date.UTC(2026, 0, 20 - index)).toISOString(),
          members: [
            {
              rawEmployeeName:
                "Karyawan dengan nama panjang untuk uji tampilan",
              assignedAmount: index === 12 ? null : 5000,
            },
          ],
        },
      }
    )
    expect(response.status()).toBe(201)
    fixtures.push((await response.json()).data)
  }
})
async function openList(page: Page) {
  await page.goto("/fines")
  await page.getByLabel("Cari kode, deskripsi, atau peserta").fill(suffix)
  await page.getByRole("button", { name: "Terapkan filter" }).click()
  await expect(page.getByRole("status")).toHaveText(
    "Menampilkan 1–6 dari 13 kejadian"
  )
}
const cards = (page: Page) =>
  page.getByRole("list", { name: "Daftar kejadian denda" }).getByRole("link")
const overflow = async (page: Page) =>
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  ).toBe(false)

test("server pagination, newest creation order, full-card clicks and keyboard links", async ({
  page,
}) => {
  await openList(page)
  await expect(cards(page)).toHaveCount(6)
  await expect(cards(page).first()).toHaveAccessibleName(
    `Lihat detail ${fixtures[12].displayCode}`
  )
  await expect(cards(page).first()).toContainText("Belum lengkap")
  await expect(
    page.getByRole("button", { name: "Sebelumnya", exact: true })
  ).toBeDisabled()
  await cards(page)
    .first()
    .getByText("Karyawan dengan nama panjang untuk uji tampilan")
    .click()
  await expect(page).toHaveURL(new RegExp(`/fines/${fixtures[12].id}$`))
  await openList(page)
  await page.getByRole("button", { name: "Berikutnya", exact: true }).click()
  await expect(page.getByRole("status")).toHaveText(
    "Menampilkan 7–12 dari 13 kejadian"
  )
  await expect(
    page.getByRole("heading", { name: "Daftar kejadian", exact: true })
  ).toBeFocused()
  await expect(cards(page).first()).toHaveAttribute(
    "href",
    `/fines/${fixtures[6].id}`
  )
  await page.getByRole("button", { name: "Berikutnya", exact: true }).click()
  await expect(cards(page)).toHaveCount(1)
  await expect(
    page.getByRole("button", { name: "Berikutnya", exact: true })
  ).toBeDisabled()
  await expect(page.getByRole("status")).toHaveText(
    "Menampilkan 13–13 dari 13 kejadian"
  )
  await page.getByLabel("Per halaman").selectOption("12")
  await expect(cards(page)).toHaveCount(12)
  await expect(page.getByRole("status")).toHaveText(
    "Menampilkan 1–12 dari 13 kejadian"
  )
  await page.getByRole("button", { name: "Berikutnya", exact: true }).click()
  await page.getByRole("button", { name: "Terapkan filter" }).click()
  await expect(page.getByRole("status")).toHaveText(
    "Menampilkan 1–12 dari 13 kejadian"
  )
  await cards(page).first().focus()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(new RegExp(`/fines/${fixtures[12].id}$`))
})

test("cards reflow in both themes, reduced motion and narrow screens", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await openList(page)
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => {
      document.documentElement.classList.toggle("dark", theme === "dark")
    }, theme)
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await overflow(page)
      await expect.poll(() => contrastFailures(page)).toEqual([])
      await expect(
        cards(page).first().getByText("Lihat detail", { exact: true })
      ).toBeVisible()
      const boxes = await cards(page).evaluateAll((links) =>
        links.map((link) => {
          const box = link.getBoundingClientRect()
          return { x: box.x, y: box.y, height: box.height }
        })
      )
      expect(boxes[0].height).toBeGreaterThan(44)
      if (width < 768) expect(boxes[1].y).toBeGreaterThan(boxes[0].y)
      else expect(boxes[1].y).toBe(boxes[0].y)
      await page.keyboard.press("Tab")
      await cards(page).first().focus()
      expect(
        await cards(page)
          .first()
          .evaluate((link) => getComputedStyle(link).outlineStyle)
      ).toBe("solid")
      await page.evaluate(() => {
        ;(document.activeElement as HTMLElement)?.blur()
        window.scrollTo(0, 0)
      })
      await page.screenshot({
        path: `/tmp/catat-denda-cards-${theme}-${width}.png`,
        fullPage: true,
      })
    }
    await page.setViewportSize({ width: 812, height: 375 })
    await overflow(page)
  }
})

test("error retry, loading, empty filters, posted and voided amounts", async ({
  page,
}) => {
  let fail = true
  await page.route("**/api/v1/fine-cases?*", async (route) => {
    if (fail)
      return route.fulfill({
        status: 503,
        json: { error: { message: "Koneksi uji terputus" } },
      })
    return route.continue()
  })
  await page.goto("/fines")
  await expect(
    page.getByRole("alert").filter({ hasText: "Koneksi uji terputus" })
  ).toHaveText("Koneksi uji terputus")
  fail = false
  await page.getByRole("button", { name: "Coba lagi" }).click()
  await expect(cards(page)).toHaveCount(6)
  await page
    .getByLabel("Cari kode, deskripsi, atau peserta")
    .fill("NO-MATCH-" + suffix)
  await page.getByRole("button", { name: "Terapkan filter" }).click()
  await expect(
    page.getByText("0 kejadian ditemukan", { exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("navigation", { name: "Pagination kejadian denda" })
  ).toHaveCount(0)
  await page.unroute("**/api/v1/fine-cases?*")
  const visualCases = [
    {
      ...fixtures[0],
      status: "POSTED",
      assessedAmount: "5000",
      outstandingAmount: "2500",
      settlementStatus: "PARTIAL",
    },
    { ...fixtures[1], status: "VOIDED", assessedAmount: "0" },
  ]
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route("**/api/v1/fine-cases?*", async (route) => {
    await pending
    await route.fulfill({
      json: {
        data: visualCases,
        meta: { page: 1, limit: 6, total: 2, totalPages: 1 },
      },
    })
  })
  await page.getByRole("button", { name: "Reset filter" }).click()
  await expect(page.getByRole("status")).toHaveText("Memuat kejadian…")
  await expect(cards(page)).toHaveCount(0)
  release()
  await expect(cards(page)).toHaveCount(2)
  await expect(cards(page).first()).toContainText("Dibayar sebagian")
  await expect(cards(page).last()).toContainText("Dibatalkan")
  await expect(cards(page).last()).toContainText("Saldo aktif")
})
