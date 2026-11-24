import type { ReactNode } from "react"

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div className="max-w-3xl min-w-0">
        {eyebrow && (
          <p className="sr-only mb-2 text-xs font-medium [overflow-wrap:anywhere] text-foreground/65">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-6 text-foreground/65">
          {description}
        </p>
      </div>
      {actions && (
        <div className="flex w-full max-w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  )
}
