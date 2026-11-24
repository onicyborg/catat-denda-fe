"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LoadState, Pager, useResource } from "@/components/master/shared"
import type { Page } from "@/lib/master"
import type { Payment } from "@/lib/payments"
import type { ReportCase, ReportSummary } from "@/lib/reporting"
import { money, wib } from "@/lib/fines"
import { useReportUrl, ReportFilters } from "./filters"
import { Metrics } from "./metrics"
import { CaseRows } from "./rows"
export function EmployeeFinance({ id }: { id: string }) {
  const url = useReportUrl(),
    v = { ...url.values, employeeId: id },
    query = new URLSearchParams(url.base)
  query.set("employeeId", id)
  const base = query.toString()
  const summary = useResource<ReportSummary>(
      `/employees/${id}/summary?${base}`
    ),
    cases = useResource<Page<ReportCase>>(
      `/reports/fine-cases?${base}&page=${encodeURIComponent(v.casePage)}`,
      true
    ),
    ledger = useResource<Page<Payment>>(
      `/payments?employeeId=${id}&from=${encodeURIComponent(v.from)}&to=${encodeURIComponent(v.to)}&page=${encodeURIComponent(v.balancePage)}`,
      true
    )
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">Alokasi dan histori karyawan</h2>
      <ReportFilters
        key={url.key}
        values={v}
        onApply={url.update}
        fixedEmployee
      />
      <Button
        className="min-h-11"
        variant="outline"
        onClick={() => {
          summary.reload()
          cases.reload()
          ledger.reload()
        }}
      >
        Segarkan saldo karyawan
      </Button>
      <LoadState
        loading={summary.loading}
        error={summary.error}
        retry={summary.reload}
      >
        {summary.data && (
          <>
            <Metrics data={summary.data} />
            <p className="text-sm text-foreground/65">
              Denda pada periode: sudah dibayar{" "}
              {money(summary.data.cohortNetPaidAmount)}, sisa denda{" "}
              {money(summary.data.cohortOutstandingAmount)}.
            </p>
          </>
        )}
      </LoadState>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Denda aktif pada periode</h3>
        <p className="text-sm text-foreground/65">
          Hanya alokasi karyawan ini yang dijumlahkan.
        </p>
        <LoadState
          loading={cases.loading}
          error={cases.error}
          retry={cases.reload}
          empty={
            cases.data?.data.length === 0
              ? "Tidak ada alokasi pada periode ini."
              : undefined
          }
        >
          {cases.data && <CaseRows rows={cases.data.data} />}
        </LoadState>
        <Pager
          result={cases.data}
          page={Number(v.casePage)}
          onChange={(page) => url.update({ casePage: String(page) })}
        />
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Riwayat pembayaran pada periode
        </h3>
        <p className="text-sm text-foreground/65">
          Tanggal pembayaran/pembalikan, termasuk kejadian dari periode lain.
        </p>
        <LoadState
          loading={ledger.loading}
          error={ledger.error}
          retry={ledger.reload}
          empty={
            ledger.data?.data.length === 0
              ? "Belum ada pembayaran pada periode ini."
              : undefined
          }
        >
          <div className="divide-y rounded-xl border bg-background">
            {ledger.data?.data.map((e) => (
              <article key={e.id} className="space-y-2 p-4">
                <Link
                  className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
                  href={"/payments/" + e.id}
                >
                  {e.kind === "PAYMENT" ? "Pembayaran" : "Pembalikan"} ·{" "}
                  {e.caseCode}
                </Link>
                <p className="text-sm">{money(e.signedAmount)}</p>
                <p className="text-xs text-foreground/65">
                  Efektif {wib(e.effectiveAt)} · Dicatat {wib(e.createdAt)}
                </p>
              </article>
            ))}
          </div>
        </LoadState>
        <Pager
          result={ledger.data}
          page={Number(v.balancePage)}
          onChange={(page) => url.update({ balancePage: String(page) })}
        />
      </div>
      <Link
        className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
        href={"/reports?" + base}
      >
        Buka laporan karyawan ini
      </Link>
    </section>
  )
}
