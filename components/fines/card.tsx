import Link from "next/link"
import { RiArrowRightLine, RiCalendarLine, RiGroupLine } from "@remixicon/react"
import {
  caseLabels,
  settlementLabels,
  money,
  wib,
  type Fine,
} from "@/lib/fines"

export function FineCard({ fine }: { fine: Fine }) {
  const draft = fine.status === "DRAFT"
  return (
    <li className="min-w-0">
      <Link
        href={`/fines/${fine.id}`}
        aria-label={`Lihat detail ${fine.displayCode}`}
        prefetch={false}
        className="group flex h-full cursor-pointer flex-col rounded-xl border border-foreground/20 bg-background p-5 text-foreground transition-colors duration-150 hover:border-foreground/50 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground active:bg-muted motion-reduce:transition-none sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold tabular-nums">{fine.displayCode}</span>
          <span
            className={`rounded-md border px-2 py-1 text-xs font-medium ${draft ? "border-dashed border-foreground/35" : "border-transparent bg-muted"}`}
          >
            {caseLabels[fine.status]}
          </span>
        </div>
        <h3 className="mt-4 text-base leading-relaxed font-semibold break-words">
          {fine.violationNameSnapshot ??
            fine.violationType?.name ??
            "Jenis belum dipilih"}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed break-words text-foreground/75">
          {fine.description || "Deskripsi belum diisi"}
        </p>
        <div className="mt-5 mb-5 space-y-2.5 text-sm text-foreground/75">
          <p className="flex items-start gap-2">
            <RiCalendarLine
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <span>{wib(fine.occurredAt)}</span>
          </p>
          <p className="flex items-start gap-2">
            <RiGroupLine
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <span className="line-clamp-2 break-words">
              {fine.members.length
                ? fine.members.map((m) => m.employeeDisplayName).join(", ")
                : "Belum ada peserta"}
            </span>
          </p>
        </div>
        <div className="mt-auto border-t pt-4">
          <p className="text-xs text-foreground/75">
            {draft
              ? "Preview alokasi"
              : fine.status === "VOIDED"
                ? "Saldo aktif"
                : "Total denda"}
          </p>
          <p className="mt-1 text-xl font-semibold break-words tabular-nums">
            {draft && !fine.amountsComplete
              ? "Belum lengkap"
              : money(draft ? fine.previewAmount : fine.assessedAmount)}
          </p>
          {fine.status === "POSTED" && (
            <p className="mt-1 text-sm text-foreground/75">
              Sisa {money(fine.outstandingAmount)} ·{" "}
              {fine.settlementStatus &&
                settlementLabels[
                  fine.settlementStatus as keyof typeof settlementLabels
                ]}
            </p>
          )}
          <div className="mt-4 flex min-h-6 items-center justify-between gap-3 text-sm font-medium">
            <span className="underline decoration-foreground/40 underline-offset-4 group-hover:decoration-foreground">
              Lihat detail
            </span>
            <RiArrowRightLine aria-hidden="true" className="size-5 shrink-0" />
          </div>
        </div>
      </Link>
    </li>
  )
}
