import Link from "next/link"
import { RiArrowRightSLine } from "@remixicon/react"
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
        className="group flex h-full cursor-pointer flex-col rounded-xl border border-foreground/20 bg-background p-4 text-foreground transition-colors hover:border-foreground/50 hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-offset-4 active:bg-muted motion-reduce:transition-none sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-medium tabular-nums">{fine.displayCode}</span>
          <span
            className={`rounded-md px-2 py-1 ${draft ? "border border-dashed border-foreground/35" : "bg-muted"}`}
          >
            {caseLabels[fine.status]}
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-base font-semibold break-words">
          {fine.violationNameSnapshot ??
            fine.violationType?.name ??
            "Jenis belum dipilih"}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm break-words text-foreground/75">
          {fine.members.length
            ? fine.members
                .map((member) => member.employeeDisplayName)
                .join(", ")
            : "Belum ada karyawan"}
        </p>
        {fine.description &&
          fine.description !==
            (fine.violationNameSnapshot ?? fine.violationType?.name) && (
            <p className="mt-2 line-clamp-2 text-sm break-words text-foreground/75">
              {fine.description}
            </p>
          )}
        <p className="mt-3 mb-4 text-xs text-foreground/70">
          {wib(fine.occurredAt)}
        </p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t pt-3">
          <div className="min-w-0">
            <p className="text-xs text-foreground/70">
              {draft
                ? "Preview alokasi"
                : fine.status === "VOIDED"
                  ? "Saldo aktif"
                  : "Total denda"}
            </p>
            <p className="mt-1 text-lg font-semibold break-words tabular-nums">
              {draft && !fine.amountsComplete
                ? "Belum lengkap"
                : money(draft ? fine.previewAmount : fine.assessedAmount)}
            </p>
          </div>
          <span className="inline-flex min-h-8 items-center gap-1 text-sm font-medium underline underline-offset-4">
            Lihat detail{" "}
            <RiArrowRightSLine aria-hidden="true" className="size-4" />
          </span>
        </div>
        {fine.status === "POSTED" && (
          <p className="mt-2 text-xs text-foreground/75">
            Sisa {money(fine.outstandingAmount)} ·{" "}
            {fine.settlementStatus &&
              settlementLabels[
                fine.settlementStatus as keyof typeof settlementLabels
              ]}
          </p>
        )}
      </Link>
    </li>
  )
}
