"use client"
import { useId, useState, type ReactNode } from "react"
import { RiArrowDownSLine } from "@remixicon/react"
import * as m from "motion/react-m"

export function Disclosure({
  title,
  summary,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  title: string
  summary?: string
  children: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setOpen] = useState(defaultOpen)
  const open = controlledOpen ?? internalOpen
  const id = useId()
  return (
    <div className="rounded-xl border bg-background">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen(!open)
          onOpenChange?.(!open)
        }}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span className="min-w-0">
          <span className="font-medium">{title}</span>
          {summary && (
            <span className="mt-0.5 block text-xs text-foreground/70">
              {summary}
            </span>
          )}
        </span>
        <m.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <RiArrowDownSLine aria-hidden="true" className="size-5" />
        </m.span>
      </button>
      <div id={id} hidden={!open} className="border-t p-4 sm:p-5">
        {children}
      </div>
    </div>
  )
}
