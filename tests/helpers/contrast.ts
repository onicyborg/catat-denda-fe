export async function contrastFailures(page: import("@playwright/test").Page) {
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
