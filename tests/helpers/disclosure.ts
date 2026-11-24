import { expect, type Page } from "@playwright/test"

export async function revealControl(page: Page, label: string) {
  const control = page.getByLabel(label).first()
  await expect(control).toBeAttached()
  for (let index = 0; index < 5 && !(await control.isVisible()); index++) {
    const id = await control.evaluate(
      (element) => element.closest<HTMLElement>("[hidden]")?.id
    )
    if (!id) break
    await page.locator(`button[aria-controls="${id}"]`).click()
  }
}
export async function openPanel(page: Page, title: string) {
  const trigger = page
    .getByRole("button", { name: new RegExp(`^${title}`) })
    .first()
  await expect(trigger).toBeAttached()
  if ((await trigger.getAttribute("aria-expanded")) === "false")
    await trigger.click()
}
