"use client"
import Link from "next/link"
import { useState } from "react"
import { Feedback, LoadState, useResource } from "@/components/master/shared"
import { LedgerAction } from "./action"
import { caseLabels, money, wib } from "@/lib/fines"
import { methods, entryKinds, type Payment } from "@/lib/payments"
export function PaymentDetail({ id }: { id: string }) {
  const result = useResource<Payment>("/payments/" + id),
    [message, setMessage] = useState(""),
    [reference, setReference] = useState("")
  const e = result.data
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/payments"
        className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
      >
        Kembali ke riwayat pembayaran
      </Link>
      <LoadState
        loading={result.loading}
        error={result.error}
        retry={result.reload}
      >
        {e && (
          <>
            <div>
              <p className="mb-2 text-sm text-foreground/65">
                {e.caseCode} · {caseLabels[e.caseStatus]}
              </p>
              <h1 className="text-3xl font-semibold">
                Detail {entryKinds[e.kind].toLowerCase()}
              </h1>
              <p className="mt-3 text-sm break-words">{e.employeeName}</p>
            </div>
            <Feedback message={message} />
            {reference && (
              <Link
                href={"/payments/" + reference}
                className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
              >
                Lihat entri pembalikan
              </Link>
            )}
            <div className="space-y-6 rounded-xl border bg-background p-4 sm:p-6">
              <div>
                <p className="text-sm text-foreground/65">
                  {e.kind === "PAYMENT"
                    ? "Nominal pembayaran"
                    : "Nominal pembalikan penuh"}
                </p>
                <p className="mt-2 text-3xl font-semibold">{money(e.amount)}</p>
                <p className="mt-2 text-sm">
                  {e.method
                    ? methods[e.method]
                    : "Mengurangi pembayaran bersih"}
                </p>
              </div>
              <dl className="grid gap-5 border-t pt-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-foreground/65">
                    Tanggal efektif
                  </dt>
                  <dd className="mt-2 text-sm">{wib(e.effectiveAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-foreground/65">Waktu dicatat</dt>
                  <dd className="mt-2 text-sm">{wib(e.createdAt)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-foreground/65">Dicatat oleh</dt>
                  <dd className="mt-2 text-sm break-words">
                    {e.recordedByName}
                    <span className="mt-1 block text-xs break-all text-foreground/65">
                      {e.recordedBy}
                    </span>
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-foreground/65">ID transaksi</dt>
                  <dd className="mt-2 text-sm break-all">{e.id}</dd>
                </div>
              </dl>
              {e.note && (
                <div className="border-t pt-5">
                  <h2 className="text-sm font-semibold">
                    {e.kind === "REVERSAL"
                      ? "Alasan pembalikan"
                      : "Catatan pembayaran"}
                  </h2>
                  <p className="mt-3 text-sm break-words whitespace-pre-wrap">
                    {e.note}
                  </p>
                </div>
              )}
              {e.originalPaymentId && (
                <Link
                  href={"/payments/" + e.originalPaymentId}
                  className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                >
                  Lihat pembayaran asli
                </Link>
              )}
              {e.reversalId && (
                <Link
                  href={"/payments/" + e.reversalId}
                  className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                >
                  Pembayaran sudah dibalik · lihat pembalikan
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={"/fines/" + e.caseId}
                className="inline-flex min-h-11 items-center rounded-full border bg-background px-5 text-sm hover:bg-muted focus-visible:outline-2"
              >
                Buka kejadian {e.caseCode}
              </Link>
              {e.canReverse && (
                <LedgerAction
                  mode="reverse"
                  target={e.id}
                  name={e.employeeName}
                  amount={String(e.amount)}
                  originalEffectiveAt={e.effectiveAt}
                  onRefresh={result.reload}
                  onDone={(entry) => {
                    setMessage(
                      "Pembayaran berhasil dibalik. Entri asli tetap tersimpan."
                    )
                    setReference(entry.id)
                    result.reload()
                  }}
                />
              )}
            </div>
            <p className="text-xs text-foreground/65">
              Histori transaksi tidak dapat diubah atau dihapus. Pembalikan
              dicatat sebagai entri terpisah dengan nominal penuh dari
              pembayaran asli.
            </p>
          </>
        )}
      </LoadState>
    </section>
  )
}
