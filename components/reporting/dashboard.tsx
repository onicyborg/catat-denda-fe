"use client"
import Link from "next/link"
import {
  RiAddLine,
  RiWallet3Line,
  RiGroupLine,
  RiRefreshLine,
} from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/workspace/page-header"
import { LoadState, useResource } from "@/components/master/shared"
import { Disclosure } from "@/components/workspace/disclosure"
import { Metrics } from "./metrics"
import { ReportFilters, useReportUrl } from "./filters"
import { CaseRows, BalanceRows } from "./rows"
import { SettlementChart, OutstandingChart } from "./dashboard-charts"
import type { DashboardData } from "@/lib/reporting"

function DashboardPlaceholder() {
  return (
    <div role="status" className="space-y-6">
      <p className="sr-only">Memuat ringkasan…</p>
      <div aria-hidden="true" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl border bg-background p-5">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="mt-6 h-6 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="grid gap-5 xl:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-80 rounded-xl border bg-background p-6">
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="mt-6 h-48 rounded-lg bg-muted/50" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function Dashboard() {
  const url = useReportUrl()
  const result = useResource<DashboardData>("/dashboard/summary?" + url.base)
  const data = result.data
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={data?.summary.businessName ?? "Ruang kerja"}
        title="Ringkasan"
        description="Apa yang ingin Anda lakukan hari ini?"
        actions={
          <>
            <Button
              className="size-11 gap-2"
              aria-label="Segarkan ringkasan"
              variant="outline"
              onClick={() => result.reload()}
            >
              <RiRefreshLine className="size-4" aria-hidden="true" />
              <span className="sr-only">Segarkan ringkasan</span>
            </Button>
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring"
              href="/fines/new"
            >
              <RiAddLine className="size-4" aria-hidden="true" />
              Catat kejadian
            </Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/payments/new"
          className="flex min-h-24 flex-col justify-center gap-2 rounded-xl border bg-background p-4 font-medium hover:bg-muted focus-visible:outline-2"
        >
          <RiWallet3Line aria-hidden="true" className="size-5" />
          <span className="text-sm">Catat pembayaran</span>
        </Link>
        <Link
          href="/employees"
          className="flex min-h-24 flex-col justify-center gap-2 rounded-xl border bg-background p-4 font-medium hover:bg-muted focus-visible:outline-2"
        >
          <RiGroupLine aria-hidden="true" className="size-5" />
          <span className="text-sm">Lihat denda karyawan</span>
        </Link>
      </div>
      <ReportFilters key={url.key} values={url.values} onApply={url.update} />
      <LoadState
        loading={result.loading}
        error={result.error}
        retry={result.reload}
        loadingView={<DashboardPlaceholder />}
      >
        {data && (
          <>
            <Metrics data={data.summary} />
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <section className="min-w-0 space-y-4 rounded-xl border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold">Denda terbaru</h2>
                <p className="text-xs leading-5 text-foreground/65">
                  Semua periode; maksimal lima kejadian sesuai filter karyawan
                  dan jenis.
                </p>
                {data.recentCases.length ? (
                  <CaseRows rows={data.recentCases} compact />
                ) : (
                  <p className="rounded-lg bg-muted/40 p-5 text-sm text-foreground/65">
                    Belum ada denda aktif pada periode ini.
                  </p>
                )}
              </section>
              <section className="min-w-0 space-y-4 rounded-xl border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold">
                  Draft belum selesai ({data.draftCount})
                </h2>
                <p className="text-xs leading-5 text-foreground/65">
                  Lengkapi draft agar denda bisa diaktifkan.
                </p>
                {data.drafts.length ? (
                  <CaseRows rows={data.drafts} compact />
                ) : (
                  <p className="rounded-lg bg-muted/40 p-5 text-sm text-foreground/65">
                    Tidak ada draft yang perlu ditinjau.
                  </p>
                )}
              </section>
            </div>
            <Disclosure
              title="Grafik penyelesaian"
              summary="Lihat perbandingan pembayaran dan sisa denda"
            >
              {" "}
              <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <SettlementChart
                  data={data.summary}
                  reportHref={"/reports?" + url.base}
                />
                <OutstandingChart rows={data.topOutstanding} />
              </div>
            </Disclosure>
            {data.topOutstanding.length > 0 && (
              <details className="rounded-xl border bg-background p-5">
                <summary className="min-h-11 cursor-pointer content-center text-sm font-medium">
                  Lihat rincian saldo karyawan
                </summary>
                <div className="mt-4">
                  <BalanceRows rows={data.topOutstanding} allDates />
                </div>
              </details>
            )}
          </>
        )}
      </LoadState>
      <div className="flex flex-wrap gap-5 text-sm">
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
