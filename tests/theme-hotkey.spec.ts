import { test, expect } from "@playwright/test"

test("login fields tolerate keyboard events without a key", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/login")
  for (const label of ["Username", "Kata sandi"]) {
    const field = page.getByLabel(label, { exact: true })
    await field.click()
    await field.evaluate((element) => {
      for (const key of [undefined, null, 1]) {
        const event = new Event("keydown", { bubbles: true })
        Object.defineProperty(event, "key", { value: key })
        element.dispatchEvent(event)
      }
    })
    await field.fill("admin")
    await expect(field).toHaveValue("admin")
  }
  await page.evaluate(() => window.dispatchEvent(new Event("keydown")))
  expect(errors).toEqual([])
  await expect(
    page.getByRole("heading", { name: "Masuk ke Catat Denda" })
  ).toBeVisible()
})

test("theme shortcut ignores typing and composition but works outside inputs", async ({
  page,
}) => {
  await page.goto("/login")
  const html = page.locator("html")
  await expect(html).toHaveClass(/light|dark/)
  const dark = await html.evaluate((element) =>
    element.classList.contains("dark")
  )
  const field = page.getByLabel("Username", { exact: true })
  await field.click()
  await field.press("d")
  await expect(field).toHaveValue("d")
  expect(await html.evaluate((el) => el.classList.contains("dark"))).toBe(dark)
  await page.evaluate(() =>
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "d", isComposing: true })
    )
  )
  expect(await html.evaluate((el) => el.classList.contains("dark"))).toBe(dark)
  await page.evaluate(() => {
    ;(document.activeElement as HTMLElement).blur()
  })
  await page.keyboard.press("d")
  await expect(html).toHaveClass(dark ? /light/ : /dark/)
})
