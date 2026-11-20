import { test, expect } from "@playwright/test"

import { contrastFailures } from "./helpers/contrast"

test("login layout, password visibility and themes", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto("/login")
  await expect(page.getByLabel("Username", { exact: true })).toBeVisible()
  const password = page.getByLabel("Kata sandi", { exact: true })
  await password.fill("test-only-value")
  await page
    .getByRole("button", { name: "Tampilkan kata sandi", exact: true })
    .click()
  await expect(password).toHaveAttribute("type", "text")
  await page
    .getByRole("button", { name: "Sembunyikan kata sandi", exact: true })
    .click()
  await expect(password).toHaveAttribute("type", "password")
  await password.fill("")
  await expect(page.locator("html")).toHaveClass(/light/)
  expect(await contrastFailures(page)).toEqual([])
  await page.screenshot({
    path: "/tmp/catat-denda-login-desktop.png",
    fullPage: true,
  })
  await page.getByRole("button", { name: "Ganti tema" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  expect(await contrastFailures(page)).toEqual([])
  await page.screenshot({
    path: "/tmp/catat-denda-login-dark.png",
    fullPage: true,
  })
  for (const width of [320, 360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBeTruthy()
    await expect(
      page.getByRole("button", { name: "Masuk", exact: true })
    ).toBeVisible()
  }
  await page.setViewportSize({ width: 360, height: 800 })
  await page.getByRole("button", { name: "Ganti tema" }).click()
  await expect(page.locator("html")).toHaveClass(/light/)
  await page.screenshot({
    path: "/tmp/catat-denda-login-mobile.png",
    fullPage: true,
  })
  await page.getByLabel("Username", { exact: true }).focus()
  await page.keyboard.press("Tab")
  await expect(password).toBeFocused()
  expect(errors).toEqual([])
})

test("finance animation loops, pauses and respects reduced motion without amounts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto("/login")
  const illustration = page.getByRole("img", {
    name: "Ilustrasi animasi dompet dan koin",
  })
  await expect(illustration).toBeVisible()
  await expect(page.locator("main")).not.toContainText(
    /Rp\s?\d|Karyawan A|Karyawan B|Contoh alokasi|Total kejadian/
  )
  expect(
    await illustration.evaluate((el) =>
      el
        .getAnimations({ subtree: true })
        .every(
          (animation) => animation.effect?.getTiming().iterations === Infinity
        )
    )
  ).toBeTruthy()
  const time = await illustration.evaluate((el) =>
    Number(el.getAnimations({ subtree: true })[0]?.currentTime ?? 0)
  )
  await expect
    .poll(() =>
      illustration.evaluate((el) =>
        Number(el.getAnimations({ subtree: true })[0]?.currentTime ?? 0)
      )
    )
    .toBeGreaterThan(time)
  await page.getByRole("button", { name: "Jeda animasi", exact: true }).click()
  await expect
    .poll(() =>
      illustration.evaluate((el) =>
        el
          .getAnimations({ subtree: true })
          .every((animation) => animation.playState === "paused")
      )
    )
    .toBeTruthy()
  await page
    .getByRole("button", { name: "Lanjutkan animasi", exact: true })
    .click()
  await expect
    .poll(() =>
      illustration.evaluate((el) =>
        el
          .getAnimations({ subtree: true })
          .every((animation) => animation.playState === "running")
      )
    )
    .toBeTruthy()
  await page.emulateMedia({ reducedMotion: "reduce" })
  await expect
    .poll(() =>
      illustration.evaluate((el) => el.getAnimations({ subtree: true }).length)
    )
    .toBe(0)
  await expect(
    page.getByRole("button", { name: "Jeda animasi", exact: true })
  ).toBeHidden()
})

test("login starts blank and clears restored credentials", async ({ page }) => {
  await page.goto("/login")
  const username = page.getByLabel("Username", { exact: true }),
    password = page.getByLabel("Kata sandi", { exact: true })
  await expect(username).toHaveValue("")
  await expect(password).toHaveValue("")
  await expect(username).toHaveAttribute("autocomplete", "off")
  await expect(password).toHaveAttribute("autocomplete", "off")
  await username.fill("unsaved-user")
  await password.fill("unsaved-password")
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true })
    )
  )
  await expect(username).toHaveValue("")
  await expect(password).toHaveValue("")
})

test("login clears browser-restored DOM values even when React state is already empty", async ({
  page,
}) => {
  await page.goto("/login")
  await expect(
    page.getByRole("button", { name: "Masuk", exact: true })
  ).toBeVisible()
  await page.evaluate(() => {
    for (const id of ["username", "password"]) {
      const input = document.getElementById(id) as HTMLInputElement
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )!.set!.call(input, "browser-saved-value")
    }
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true })
    )
  })
  await expect(page.getByLabel("Username", { exact: true })).toHaveValue("")
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveValue("")
})

test("late autofill is cleared before interaction but typed values are preserved", async ({
  page,
}) => {
  await page.goto("/login")
  await expect(
    page.getByRole("button", { name: "Masuk", exact: true })
  ).toBeVisible()
  const username = page.getByLabel("Username", { exact: true }),
    password = page.getByLabel("Kata sandi", { exact: true })
  await page.evaluate(() => {
    for (const id of ["username", "password"]) {
      const input = document.getElementById(id) as HTMLInputElement
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )!.set!.call(input, "late-browser-autofill")
      input.dispatchEvent(
        new AnimationEvent("animationstart", {
          bubbles: true,
          animationName: "autofill-detected",
        })
      )
    }
  })
  await expect(username).toHaveValue("")
  await expect(password).toHaveValue("")
  await username.fill("manually-typed-user")
  await password.fill("manually-typed-password")
  await page.evaluate(() => {
    for (const id of ["username", "password"])
      document.getElementById(id)!.dispatchEvent(
        new AnimationEvent("animationstart", {
          bubbles: true,
          animationName: "autofill-detected",
        })
      )
    window.dispatchEvent(new Event("focus"))
  })
  await expect(username).toHaveValue("manually-typed-user")
  await expect(password).toHaveValue("manually-typed-password")
})

test("initial pageshow arriving after typing does not erase manual credentials", async ({
  page,
}) => {
  await page.goto("/login")
  const username = page.getByLabel("Username", { exact: true }),
    password = page.getByLabel("Kata sandi", { exact: true })
  await username.fill("typed-before-pageshow")
  await password.fill("manual-password")
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: false })
    )
  )
  await expect(username).toHaveValue("typed-before-pageshow")
  await expect(password).toHaveValue("manual-password")
})
