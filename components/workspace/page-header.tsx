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
          <p className="mb-2 text-xs font-medium [overflow-wrap:anywhere] text-foreground/65">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/65">
          {description}
        </p>
      </div>
      {actions && (
        <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
