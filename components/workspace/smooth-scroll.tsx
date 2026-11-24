"use client"
import { useEffect } from "react"

export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const finePointer = window.matchMedia("(pointer: fine)")
    let dispose: (() => void) | undefined
    let revision = 0
    const update = async () => {
      const current = ++revision
      dispose?.()
      dispose = undefined
      if (reduced.matches || !finePointer.matches) return
      const { default: Lenis } = await import("lenis")
      if (current !== revision) return
      const lenis = new Lenis({
        autoRaf: true,
        duration: 0.65,
        smoothWheel: true,
        syncTouch: false,
        anchors: false,
        prevent: (element) =>
          Boolean(
            element.closest(
              '[role="dialog"], textarea, input, select, [data-lenis-prevent]'
            )
          ),
      })
      const focus = () =>
        lenis.scrollTo(window.scrollY, { immediate: true, force: true })
      const content = new ResizeObserver(() => lenis.resize())
      content.observe(document.body)
      window.addEventListener("focusin", focus)
      dispose = () => {
        content.disconnect()
        window.removeEventListener("focusin", focus)
        lenis.destroy()
      }
    }
    void update()
    reduced.addEventListener("change", update)
    finePointer.addEventListener("change", update)
    return () => {
      revision++
      dispose?.()
      reduced.removeEventListener("change", update)
      finePointer.removeEventListener("change", update)
    }
  }, [])
  return null
}
