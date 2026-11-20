"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LoadState, useResource } from "@/components/master/shared"
import { Metrics } from "./metrics"
import { ReportFilters, useReportUrl } from "./filters"
import { CaseRows, BalanceRows } from "./rows"
import type { DashboardData } from "@/lib/reporting"
export function Dashboard() {
  const url = useReportUrl(),
    result = useResource<DashboardData>("/dashboard/summary?" + url.base),
    data = result.data
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm [overflow-wrap:anywhere] break-words text-foreground/65">
            {data?.summary.businessName ?? "Ruang kerja"}
          </p>
          <h1 className="text-3xl font-semibold">Ringkasan</h1>
          <p className="mt-3 text-sm text-foreground/65">
            Kejadian periode, arus pembayaran, dan saldo saat ini.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm text-primary-foreground focus-visible:outline-2"
          href="/fines/new"
        >
          Catat kejadian
        </Link>
      </div>
      <ReportFilters key={url.key} values={url.values} onApply={url.update} />
      <Button
        className="min-h-11"
        variant="outline"
        onClick={() => result.reload()}
      >
        Segarkan ringkasan
      </Button>
      <LoadState
        loading={result.loading}
        error={result.error}
        retry={result.reload}
      >
        {data && (
          <>
            <Metrics data={data.summary} />
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">
                Kejadian terbaru menurut tanggal
              </h2>
              <p className="text-sm text-foreground/65">
                Semua periode; maksimal lima kejadian sesuai filter karyawan dan
                jenis.
              </p>
              {data.recentCases.length ? (
                <CaseRows rows={data.recentCases} />
              ) : (
                <p className="rounded-xl border p-6 text-sm">
                  Belum ada kejadian diposting.
                </p>
              )}
            </section>
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">
                Draft perlu ditinjau ({data.draftCount})
              </h2>
              {data.drafts.length ? (
                <CaseRows rows={data.drafts} />
              ) : (
                <p className="rounded-xl border p-6 text-sm">
                  Tidak ada draft yang perlu ditinjau.
                </p>
              )}
            </section>
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Sisa terbesar saat ini</h2>
              <p className="text-sm text-foreground/65">
                Seluruh kejadian POSTED lintas periode, sesuai filter yang
                dipilih.
              </p>
              {data.topOutstanding.length ? (
                <BalanceRows rows={data.topOutstanding} allDates />
              ) : (
                <p className="rounded-xl border p-6 text-sm">
                  Tidak ada sisa denda aktif.
                </p>
              )}
            </section>
          </>
        )}
      </LoadState>
      <div className="flex flex-wrap gap-5 text-sm">
        <Link
          className="inline-flex min-h-11 items-center underline underline-offset-4"
          href={"/reports?" + url.base}
        >
          Buka laporan periode
        </Link>
        <Link
          className="inline-flex min-h-11 items-center underline underline-offset-4"
          href="/employees"
        >
          Kelola karyawan
        </Link>
        <Link
          className="inline-flex min-h-11 items-center underline underline-offset-4"
          href="/mistake-types"
        >
          Kelola jenis kesalahan
        </Link>
      </div>
    </section>
  )
}
