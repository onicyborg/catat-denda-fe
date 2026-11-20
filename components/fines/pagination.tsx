import { Button } from "@/components/ui/button"
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react"
import type { Page } from "@/lib/master"

export function FinePagination({
  meta,
  page,
  onChange,
}: {
  meta: Page<unknown>["meta"]
  page: number
  onChange: (page: number) => void
}) {
  const totalPages = Math.max(1, meta.totalPages)
  const pages = Array.from(new Set([1, page - 1, page, page + 1, totalPages]))
    .filter((number) => number > 0 && number <= totalPages)
    .sort((a, b) => a - b)
  return (
    <nav
      aria-label="Pagination kejadian denda"
      className="flex flex-col flex-wrap items-center justify-between gap-4 border-t pt-5 sm:flex-row"
    >
      <p className="text-sm text-foreground/75">
        Halaman {page} dari {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="h-11 px-3"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <RiArrowLeftSLine aria-hidden="true" /> Sebelumnya
        </Button>
        <div className="hidden items-center gap-2 md:flex">
          {pages.map((number, index) => (
            <span key={number} className="flex items-center gap-2">
              {index > 0 && number - pages[index - 1] > 1 && (
                <span aria-hidden="true">…</span>
              )}
              <Button
                variant={number === page ? "default" : "outline"}
                className={`size-11 ${number === page ? "hover:bg-primary/90" : ""}`}
                aria-label={`Halaman ${number}`}
                aria-current={number === page ? "page" : undefined}
                onClick={() => onChange(number)}
              >
                {number}
              </Button>
            </span>
          ))}
        </div>
        <Button
          variant="outline"
          className="h-11 px-3"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Berikutnya <RiArrowRightSLine aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
