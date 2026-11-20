import { money } from "@/lib/fines"
import type { ReportSummary } from "@/lib/reporting"
export function Metrics({ data }: { data: ReportSummary }) {
  const rows = [
    ["Kejadian diposting pada periode", data.caseCount, false],
    ["Alokasi kejadian pada periode", data.assessedAmount, true],
    ["Pembayaran bersih pada periode", data.periodNetPaidAmount, true],
    ["Sisa seluruh kejadian saat ini", data.currentOutstandingAmount, true],
  ] as const
  return (
    <div className="space-y-4">
      <dl className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(([label, value, currency]) => (
          <div key={label} className="min-w-0 space-y-3 bg-background p-5">
            <dt className="text-sm text-foreground/65">{label}</dt>
            <dd className="text-2xl font-semibold [overflow-wrap:anywhere] break-words">
              {currency ? money(value) : value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs leading-relaxed text-foreground/65">
        Alokasi mengikuti tanggal kejadian. Pembayaran bersih mengikuti tanggal
        efektif PAYMENT dikurangi REVERSAL, termasuk histori kejadian
        dibatalkan. Sisa saat ini lintas periode, dengan filter karyawan/jenis
        yang dipilih.
      </p>
    </div>
  )
}
