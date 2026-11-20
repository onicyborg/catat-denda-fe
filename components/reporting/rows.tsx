import Link from "next/link"
import { caseLabels, money, wib } from "@/lib/fines"
import type { ReportCase, ReportBalance } from "@/lib/reporting"
export function CaseRows({
  rows,
  compact = false,
}: {
  rows: ReportCase[]
  compact?: boolean
}) {
  return (
    <div
      className={
        compact ? "divide-y" : "divide-y rounded-xl border bg-background"
      }
    >
      {rows.map((row) => (
        <article
          key={row.id}
          className={`flex min-w-0 flex-wrap justify-between gap-3 ${compact ? "py-4 first:pt-0 last:pb-0" : "p-4 sm:p-5"}`}
        >
          <div className="min-w-0 flex-1 basis-40 space-y-1.5">
            <Link
              className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 focus-visible:outline-2"
              href={"/fines/" + row.id}
            >
              {row.caseCode}
            </Link>
            <p className="text-xs text-foreground/65">
              {caseLabels[row.status]} · {wib(row.occurredAt)}
            </p>
            <p className="text-sm break-words">
              {row.violationName ?? "Jenis belum ditentukan"}
            </p>
            {(!compact || row.status === "DRAFT") && (
              <p
                className={`text-sm [overflow-wrap:anywhere] break-words text-foreground/65 ${compact ? "line-clamp-2" : ""}`}
              >
                {row.description ?? "Deskripsi belum diisi"}
              </p>
            )}
            {!compact && (
              <p className="text-xs text-foreground/65">
                {row.allocationCount} alokasi sesuai filter
                {row.unknownAmountCount !== "0"
                  ? ` · ${row.unknownAmountCount} nominal belum diisi`
                  : ""}
              </p>
            )}
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-xs text-foreground/65">
              {row.status === "DRAFT"
                ? "Preview alokasi"
                : row.status === "POSTED"
                  ? "Alokasi aktif"
                  : "Saldo aktif"}
            </p>
            <p
              className={`${compact ? "text-base" : "text-xl"} font-semibold [overflow-wrap:anywhere] tabular-nums`}
            >
              {money(
                row.status === "DRAFT" ? row.previewAmount : row.assessedAmount
              )}
            </p>
            {row.status === "POSTED" && (
              <p className="text-sm text-foreground/65">
                Sisa kohort {money(row.outstandingAmount)}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
export function BalanceRows({
  rows,
  allDates = false,
}: {
  rows: ReportBalance[]
  allDates?: boolean
}) {
  return (
    <div className="divide-y rounded-xl border bg-background">
      {rows.map((row) => (
        <article
          className="grid gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,auto))]"
          key={row.employeeId}
        >
          <div className="min-w-0">
            <Link
              className="inline-flex min-h-11 items-center font-semibold break-words underline underline-offset-4"
              href={"/employees/" + row.employeeId}
            >
              {row.employeeName}
            </Link>
            <p className="text-xs text-foreground/65">
              {row.employeeCode ?? "Tanpa kode"} · {row.caseCount} kejadian unik
              {!row.isActive ? " · Diarsipkan" : ""}
            </p>
          </div>
          {[
            [allDates ? "Alokasi aktif" : "Alokasi kohort", row.assessedAmount],
            ["Dibayar kumulatif", row.netPaidAmount],
            [allDates ? "Sisa saat ini" : "Sisa kohort", row.outstandingAmount],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-foreground/65">{label}</p>
              <p className="mt-2 text-base font-semibold">{money(value)}</p>
            </div>
          ))}
        </article>
      ))}
    </div>
  )
}
