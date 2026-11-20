import Link from "next/link"
import { money } from "@/lib/fines"
import type { ReportBalance, ReportSummary } from "@/lib/reporting"

function fraction(value: bigint, total: bigint) {
  return total > BigInt(0) ? Number((value * BigInt(10000)) / total) / 100 : 0
}

export function SettlementChart({
  data,
  reportHref,
}: {
  data: ReportSummary
  reportHref: string
}) {
  const total = BigInt(data.assessedAmount)
  const paid = BigInt(data.cohortNetPaidAmount)
  const percent = fraction(paid, total)
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(percent)
  return (
    <section
      aria-labelledby="settlement-chart-title"
      className="min-w-0 rounded-xl border bg-background p-5 sm:p-6"
    >
      <div className="mb-5">
        <h2 id="settlement-chart-title" className="text-base font-semibold">
          Penyelesaian alokasi
        </h2>
        <p className="mt-1 text-xs leading-5 text-foreground/65">
          Kejadian pada periode terpilih, pembayaran kumulatif hingga saat ini.
        </p>
      </div>
      {total > BigInt(0) ? (
        <>
          <figure
            aria-label={`${formatted}% alokasi periode telah dibayar`}
            className="flex flex-wrap items-center justify-center gap-6 sm:justify-start"
          >
            <div className="relative size-44 shrink-0">
              <svg
                viewBox="0 0 160 160"
                className="size-full -rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="var(--foreground)"
                  strokeOpacity="0.5"
                  strokeWidth="15"
                  strokeDasharray="2 3"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="var(--chart-2)"
                  strokeWidth="15"
                  pathLength="100"
                  strokeDasharray={`${percent} ${100 - percent}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold tabular-nums">
                  {formatted}%
                </span>
                <span className="mt-1 text-xs text-foreground/65">
                  telah dibayar
                </span>
              </div>
            </div>
            <figcaption className="grid w-full min-w-0 grid-cols-2 gap-5 sm:w-auto sm:flex-1 sm:basis-36 sm:grid-cols-1">
              <div>
                <p className="flex items-center gap-2 text-xs text-foreground/65">
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-sm bg-chart-2"
                  />
                  Dibayar kumulatif
                </p>
                <p className="mt-1 text-lg font-semibold [overflow-wrap:anywhere] tabular-nums">
                  {money(data.cohortNetPaidAmount)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs text-foreground/65">
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-sm border border-dashed border-foreground bg-foreground/10"
                  />
                  Sisa kohort
                </p>
                <p className="mt-1 text-lg font-semibold [overflow-wrap:anywhere] tabular-nums">
                  {money(data.cohortOutstandingAmount)}
                </p>
              </div>
            </figcaption>
          </figure>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs">
            <span className="text-foreground/65">Total alokasi periode</span>
            <span className="font-semibold [overflow-wrap:anywhere] tabular-nums">
              {money(data.assessedAmount)}
            </span>
          </div>
        </>
      ) : (
        <div className="flex min-h-48 flex-col justify-center rounded-lg bg-muted/40 p-5">
          <p className="text-sm font-medium">
            Belum ada alokasi pada periode ini.
          </p>
          <p className="mt-2 text-xs leading-5 text-foreground/65">
            Pilih periode lain atau posting kejadian untuk melihat
            penyelesaiannya.
          </p>
        </div>
      )}
      <Link
        href={reportHref}
        className="mt-3 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
      >
        Buka laporan periode
      </Link>
    </section>
  )
}

export function OutstandingChart({ rows }: { rows: ReportBalance[] }) {
  const sorted = [...rows].sort((a, b) =>
    BigInt(a.outstandingAmount) > BigInt(b.outstandingAmount)
      ? -1
      : BigInt(a.outstandingAmount) < BigInt(b.outstandingAmount)
        ? 1
        : 0
  )
  const max = sorted.length ? BigInt(sorted[0].outstandingAmount) : BigInt(0)
  return (
    <section
      aria-labelledby="outstanding-chart-title"
      className="min-w-0 rounded-xl border bg-background p-5 sm:p-6"
    >
      <h2 id="outstanding-chart-title" className="text-base font-semibold">
        Sisa terbesar saat ini
      </h2>
      <p className="mt-1 text-xs leading-5 text-foreground/65">
        Maksimal lima karyawan. Seluruh kejadian POSTED lintas periode, sesuai
        filter yang dipilih.
      </p>
      {max > BigInt(0) ? (
        <figure className="mt-6">
          <ol className="space-y-5">
            {sorted.map((row, index) => (
              <li key={row.employeeId}>
                <Link
                  href={"/employees/" + row.employeeId}
                  className="group block min-h-11 min-w-0 rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <div className="mb-2 flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0 font-medium [overflow-wrap:anywhere] underline-offset-4 group-hover:underline">
                      {row.employeeName}
                    </span>
                    <span className="max-w-[50%] min-w-0 shrink-0 text-right text-xs font-semibold [overflow-wrap:anywhere] tabular-nums">
                      {money(row.outstandingAmount)}
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="h-2 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-chart-2"
                      style={{
                        width: `${fraction(BigInt(row.outstandingAmount), max)}%`,
                      }}
                    />
                  </div>
                  <p className="sr-only">
                    Peringkat {index + 1}, {row.caseCount} kejadian.
                  </p>
                </Link>
              </li>
            ))}
          </ol>
          <figcaption className="mt-5 border-t pt-4 text-xs leading-5 text-foreground/65">
            Panjang batang membandingkan sisa antar karyawan dalam rupiah. Pilih
            nama untuk melihat riwayat.
          </figcaption>
        </figure>
      ) : (
        <div className="mt-5 flex min-h-48 flex-col justify-center rounded-lg bg-muted/40 p-5">
          <p className="text-sm font-medium">Tidak ada saldo outstanding.</p>
          <p className="mt-2 text-xs leading-5 text-foreground/65">
            Sisa kewajiban karyawan akan muncul di sini.
          </p>
        </div>
      )}
    </section>
  )
}
