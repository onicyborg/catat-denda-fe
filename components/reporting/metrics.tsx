import { money } from "@/lib/fines"
import type { ReportSummary } from "@/lib/reporting"
import {
  RiFileList3Line,
  RiMoneyDollarCircleLine,
  RiWallet3Line,
  RiTimeLine,
} from "@remixicon/react"
export function Metrics({ data }: { data: ReportSummary }) {
  const rows = [
    [
      "Denda periode ini",
      data.caseCount,
      false,
      RiFileList3Line,
      "Sesuai tanggal kejadian",
    ],
    [
      "Total denda periode ini",
      data.assessedAmount,
      true,
      RiMoneyDollarCircleLine,
      "Total tanggung jawab peserta",
    ],
    [
      "Pembayaran periode ini",
      data.periodNetPaidAmount,
      true,
      RiWallet3Line,
      "Pembayaran dikurangi pembalikan",
    ],
    [
      "Sisa denda saat ini",
      data.currentOutstandingAmount,
      true,
      RiTimeLine,
      "Seluruh periode sesuai filter",
    ],
  ] as const
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {rows.map(([label, value, currency, Icon, note]) => (
          <div
            key={label}
            className="relative min-w-0 rounded-xl border bg-background p-4 sm:p-5"
          >
            <dl>
              <dt className="flex min-h-10 items-start justify-between gap-3 text-xs leading-5 text-foreground/65">
                {label}
                <Icon
                  className="hidden size-[18px] shrink-0 text-foreground/65 sm:block"
                  aria-hidden="true"
                />
              </dt>
              <dd className="mt-3 text-xl font-semibold tracking-tight [overflow-wrap:anywhere] break-words tabular-nums sm:text-2xl">
                {currency ? money(value) : value}
              </dd>
            </dl>
            <p className="mt-2 hidden text-xs leading-5 text-foreground/65 sm:block">
              {note}
            </p>
          </div>
        ))}
      </div>
      <details className="text-xs text-foreground/70">
        <summary className="cursor-pointer content-center">
          Cara membaca ringkasan
        </summary>
        <p className="max-w-3xl pb-3 leading-relaxed">
          Total denda mengikuti tanggal kejadian. Pembayaran mengikuti tanggal
          transaksi dan sudah dikurangi pembalikan. Sisa denda saat ini mencakup
          semua periode sesuai filter.
        </p>
      </details>
    </div>
  )
}
