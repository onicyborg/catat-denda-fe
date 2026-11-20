"use client"
import { useState } from "react"
import { PageHeader } from "@/components/workspace/page-header"
import { Button } from "@/components/ui/button"
import {
  Feedback,
  LoadState,
  Pager,
  selectClass,
  useResource,
} from "@/components/master/shared"
import { downloadCsv } from "@/lib/api"
import { money } from "@/lib/fines"
import type { Page } from "@/lib/master"
import type { ReportSummary, ReportBalance, ReportCase } from "@/lib/reporting"
import { ReportFilters, useReportUrl } from "./filters"
import { Metrics } from "./metrics"
import { CaseRows, BalanceRows } from "./rows"
export function Reports() {
  const url = useReportUrl(),
    v = url.values,
    summary = useResource<ReportSummary>("/reports/summary?" + url.base),
    balances = useResource<Page<ReportBalance>>(
      `/reports/employee-balances?${url.base}&page=${encodeURIComponent(v.balancePage)}`,
      true
    ),
    cases = useResource<Page<ReportCase>>(
      `/reports/fine-cases?${url.base}&status=${encodeURIComponent(v.status)}&includeUndated=${encodeURIComponent(v.includeUndated)}&page=${encodeURIComponent(v.casePage)}`,
      true
    )
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("")
  const exportFile = async (kind: "fine-cases" | "payments") => {
    if (busy || url.pending) return
    setBusy(kind)
    setError("")
    setMessage("")
    try {
      await downloadCsv(
        `/reports/${kind}.csv?${url.base}${kind === "fine-cases" ? `&status=${encodeURIComponent(v.status)}&includeUndated=${encodeURIComponent(v.includeUndated)}` : v.kind ? "&kind=" + encodeURIComponent(v.kind) : ""}`
      )
      setMessage("File CSV berhasil disiapkan.")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy("")
    }
  }
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={summary.data?.businessName ?? "Register operasional"}
        title="Laporan"
        description="Rekap kejadian, saldo kohort, dan ekspor dengan definisi tanggal yang sama."
      />
      <ReportFilters key={url.key} values={v} onApply={url.update} cases />
      <Button
        className="min-h-11"
        variant="outline"
        onClick={() => {
          summary.reload()
          balances.reload()
          cases.reload()
        }}
      >
        Segarkan laporan
      </Button>
      <LoadState
        loading={summary.loading}
        error={summary.error}
        retry={summary.reload}
      >
        {summary.data && <Metrics data={summary.data} />}
      </LoadState>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Saldo kohort per karyawan</h2>
        <p className="text-sm text-foreground/65">
          Case POSTED dengan tanggal kejadian pada periode. Pembayaran kumulatif
          hingga saat ini untuk alokasi tersebut, termasuk pembayaran di luar
          periode.
        </p>
        {summary.data && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <p>
              {summary.data.caseCount} kejadian unik ·{" "}
              {summary.data.allocationCount} alokasi
            </p>
            <p>Dibayar kumulatif {money(summary.data.cohortNetPaidAmount)}</p>
            <p>Sisa kohort {money(summary.data.cohortOutstandingAmount)}</p>
          </div>
        )}
        <LoadState
          loading={balances.loading}
          error={balances.error}
          retry={balances.reload}
          empty={
            balances.data?.data.length === 0
              ? "Tidak ada alokasi POSTED pada kohort ini."
              : undefined
          }
        >
          {balances.data && <BalanceRows rows={balances.data.data} />}
        </LoadState>
        <Pager
          result={balances.data}
          page={Number(v.balancePage)}
          onChange={(page) => url.update({ balancePage: String(page) })}
        />
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Daftar kejadian sesuai filter</h2>
        <p className="text-sm text-foreground/65">
          Status dan opsi tanpa tanggal berlaku pada daftar ini serta CSV
          kejadian. Metrik aktif di atas tetap hanya POSTED. Bila karyawan
          dipilih, nominal hanya menjumlahkan alokasi karyawan tersebut.
        </p>
        <LoadState
          loading={cases.loading}
          error={cases.error}
          retry={cases.reload}
          empty={
            cases.data?.data.length === 0
              ? "Tidak ada kejadian sesuai filter."
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
      </section>
      <section className="space-y-4 rounded-xl border bg-background p-4 sm:p-6">
        <h2 className="text-xl font-semibold">Ekspor CSV</h2>
        <p className="text-sm text-foreground/65">
          CSV kejadian berisi satu baris per alokasi. Kejadian tanpa peserta
          tidak menghasilkan baris. Nominal draft yang belum diketahui tetap
          kosong. Alokasi VOIDED mempertahankan nominal historis; pembayaran,
          sisa, dan settlement draft/VOIDED kosong.
        </p>
        <p className="text-sm text-foreground/65">
          CSV pembayaran mengikuti tanggal efektif dan seluruh histori ledger.
          Filter status kejadian tidak berlaku pada CSV pembayaran.
        </p>
        {summary.data && (
          <p className="text-xs text-foreground/65">
            Batas server: {summary.data.exportMaxDays} hari dan{" "}
            {summary.data.exportMaxRows} baris. Hasil terlalu besar akan
            ditolak, tanpa pemotongan data.
          </p>
        )}
        <div className="max-w-sm space-y-2 text-sm">
          <label htmlFor="csv-kind">Jenis entri pada CSV pembayaran</label>
          <select
            className={selectClass}
            id="csv-kind"
            value={v.kind}
            onChange={(e) => url.update({ kind: e.target.value })}
          >
            <option value="">PAYMENT dan REVERSAL</option>
            <option value="PAYMENT">Pembayaran</option>
            <option value="REVERSAL">Pembalikan</option>
          </select>
        </div>
        <Feedback error={error} />
        <Feedback message={message} />
        <div className="flex flex-wrap gap-3">
          <Button
            className="min-h-11"
            disabled={!!busy || url.pending}
            onClick={() => exportFile("fine-cases")}
          >
            {busy === "fine-cases" ? "Menyiapkan CSV…" : "Unduh CSV kejadian"}
          </Button>
          <Button
            className="min-h-11"
            variant="outline"
            disabled={!!busy || url.pending}
            onClick={() => exportFile("payments")}
          >
            {busy === "payments" ? "Menyiapkan CSV…" : "Unduh CSV pembayaran"}
          </Button>
        </div>
      </section>
    </section>
  )
}
