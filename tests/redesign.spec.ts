import { openPanel } from "./helpers/disclosure"
import { test, expect } from "@playwright/test"
import { contrastFailures } from "./helpers/contrast"

test.use({ storageState: "/tmp/catat-denda-master-qa-session.json" })

test("workspace charts reflect real cohort data and reflow across themes and screen sizes", async ({
  page,
}) => {
  const me = (await (await page.request.get("/api/v1/auth/me")).json()).data
  const suffix = crypto.randomUUID().slice(0, 8)
  const post = async (path: string, data: object) => {
    const result = await page.request.post("/api/v1" + path, {
      headers: {
        Origin: "http://localhost:3100",
        "X-CSRF-Token": me.csrfToken,
        "Idempotency-Key": crypto.randomUUID(),
      },
      data,
    })
    expect(result.status()).toBe(201)
    return (await result.json()).data
  }
  const type = await post("/violation-types", {
    code: "UX-" + suffix,
    name: "Ketertiban operasional (QA)",
    category: "OTHER",
    defaultAmountPerPerson: 5000,
  })
  const amounts = [12000, 10000, 8000, 15000, 5000]
  const payments = [4000, 10000, 0, 5000, 1000]
  const members: string[] = []
  for (const [i, name] of [
    "Nadia",
    "Rizal",
    "Alya",
    "Dimas",
    "Intan",
  ].entries()) {
    const employee = await post("/employees", {
      displayName: name + " (QA)",
      employeeCode: `UX${i}-${suffix}`,
    })
    let fine = await post("/fine-cases", {
      occurredAt: `2026-01-0${i + 1}T09:00:00+07:00`,
      violationTypeId: type.id,
      description: "Pencatatan simulasi untuk pemeriksaan tampilan.",
      members: [{ employeeId: employee.id, assignedAmount: amounts[i] }],
    })
    fine = await post(`/fine-cases/${fine.id}/post`, { version: 1 })
    members.push(fine.members[0].id)
    if (payments[i])
      await post(`/fine-members/${fine.members[0].id}/payments`, {
        amount: payments[i],
        method: "CASH",
        effectiveAt: "2026-02-01T10:00:00+07:00",
      })
  }
  await post("/fine-cases", {
    description: "Draft menunggu kelengkapan (QA)",
    violationTypeId: type.id,
  })
  const route = `/dashboard?from=2026-01-01&to=2026-01-31&violationTypeId=${type.id}`
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 1050 })
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  )
  await page.goto(route)
  await openPanel(page, "Grafik penyelesaian")
  const chart = page.getByRole("region", {
    name: "Penyelesaian alokasi",
    exact: true,
  })
  await openPanel(page, "Grafik penyelesaian")
  await expect(chart.getByRole("figure")).toHaveAccessibleName(
    "40% alokasi periode telah dibayar"
  )
  await expect(chart).toContainText(/Rp\s?20\.000/)
  await expect(chart).toContainText(/Rp\s?30\.000/)
  // All payments are in February. A January cashflow ratio would be wrong.
  await expect(
    page
      .locator("dl")
      .filter({
        has: page.getByText("Pembayaran periode ini", { exact: true }),
      })
      .getByText("Rp 0", { exact: true })
  ).toBeVisible()
  const ranking = page.getByRole("region", {
    name: "Sisa terbesar saat ini",
    exact: true,
  })
  await expect(ranking.getByRole("listitem").first()).toContainText(
    "Dimas (QA)"
  )
  await expect(ranking.getByRole("listitem").first()).toContainText(
    /Rp\s?10\.000/
  )
  await expect(
    page
      .getByRole("navigation", { name: "Menu utama" })
      .getByRole("link", { name: "Ringkasan", exact: true })
  ).toHaveAttribute("aria-current", "page")
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => localStorage.setItem("theme", theme), theme)
    await page.reload()
    await openPanel(page, "Grafik penyelesaian")
    await expect(chart.getByRole("figure")).toHaveAccessibleName(
      "40% alokasi periode telah dibayar"
    )
    for (const width of [320, 360, 640, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1050 })
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      )
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        ),
        `${theme} ${width}px`
      ).toBeTruthy()
    }
    expect(
      await contrastFailures(page, '.workspace *, [role="dialog"] *')
    ).toEqual([])
    await page.setViewportSize({ width: 1440, height: 1050 })
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    )
    if (theme === "light")
      await page.screenshot({ path: "/tmp/catat-denda-redesign-preview.png" })
    await page.screenshot({
      path: `/tmp/catat-denda-redesign-dashboard-${theme}.png`,
      fullPage: true,
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    )
    await page.screenshot({
      path: `/tmp/catat-denda-redesign-mobile-${theme}.png`,
      fullPage: true,
    })
  }
  await page.getByRole("button", { name: "Menu", exact: true }).click()
  const menu = page.getByRole("dialog")
  await expect(
    menu.getByRole("navigation", { name: "Menu utama" })
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(menu).not.toBeVisible()
  await expect(
    page.getByRole("button", { name: "Menu", exact: true })
  ).toBeFocused()
  await page.getByRole("button", { name: "Ganti tema" }).click()
  await expect(page.locator("html")).toHaveClass(/light/)
  await page.goto(
    `/dashboard?from=2024-01-01&to=2024-01-31&violationTypeId=${type.id}`
  )
  await openPanel(page, "Grafik penyelesaian")
  await expect(
    chart.getByText("Belum ada alokasi pada periode ini.", { exact: true })
  ).toBeVisible()
  await openPanel(page, "Grafik penyelesaian")
  await expect(chart.getByRole("figure")).toHaveCount(0)
  await expect(ranking.getByRole("listitem").first()).toContainText(
    /Rp\s?10\.000/
  )
  for (const [i, member] of members.entries()) {
    if (amounts[i] > payments[i])
      await post(`/fine-members/${member}/payments`, {
        amount: amounts[i] - payments[i],
        method: "CASH",
        effectiveAt: "2026-03-01T10:00:00+07:00",
      })
  }
  await page.goto(route)
  await openPanel(page, "Grafik penyelesaian")
  await expect(chart.getByRole("figure")).toHaveAccessibleName(
    "100% alokasi periode telah dibayar"
  )
  await expect(
    ranking.getByText("Tidak ada saldo outstanding.", { exact: true })
  ).toBeVisible()
  const skip = page.getByRole("link", {
    name: "Langsung ke konten",
    exact: true,
  })
  await skip.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("main")).toBeFocused()
  const headingBounds = await page
    .getByRole("heading", { name: "Ringkasan", exact: true })
    .boundingBox()
  const headerBounds = await page.getByRole("banner").boundingBox()
  expect(headingBounds!.y).toBeGreaterThanOrEqual(
    headerBounds!.y + headerBounds!.height
  )
  expect(errors).toEqual([])
})
