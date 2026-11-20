import { test, expect } from "@playwright/test"

async function contrastFailures(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d")!
    const rgba = (color: string) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      return [...ctx.getImageData(0, 0, 1, 1).data].map((v, i) =>
        i === 3 ? v / 255 : v / 255
      )
    }
    const blend = (a: number[], b: number[]) =>
      [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat(1)
    const background = (el: Element | null): number[] =>
      el
        ? blend(
            rgba(getComputedStyle(el).backgroundColor),
            background(el.parentElement)
          )
        : [1, 1, 1, 1]
    const luminance = (rgb: number[]) =>
      rgb
        .slice(0, 3)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0)
    const failures: string[] = []
    for (const el of document.querySelectorAll("main *")) {
      if (!el.getBoundingClientRect().width) continue
      const hasText = [...el.childNodes].some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()
      )
      for (const pseudo of hasText
        ? [null]
        : el instanceof HTMLInputElement
          ? ["::placeholder"]
          : []) {
        const style = getComputedStyle(el, pseudo)
        const bg = background(el),
          fg = blend(rgba(style.color), bg)
        const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
        const ratio = (l1 + 0.05) / (l2 + 0.05)
        const threshold = parseFloat(style.fontSize) >= 24 ? 3 : 4.5
        if (ratio < threshold)
          failures.push(
            `${el.textContent?.trim().slice(0, 45) || "placeholder"}: ${ratio.toFixed(2)}`
          )
      }
    }
    return failures
  })
}

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
