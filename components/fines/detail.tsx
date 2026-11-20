"use client"
import Link from "next/link"
import { LedgerAction } from "@/components/payments/action"
import { methods } from "@/lib/payments"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Feedback,
  LoadState,
  useResource,
  selectClass,
} from "@/components/master/shared"
import { FineForm } from "./form"
import { useAdmin } from "@/components/admin-context"
import { api } from "@/lib/api"
import {
  caseLabels,
  settlementLabels,
  money,
  wib,
  type Fine,
} from "@/lib/fines"
import { categories } from "@/lib/master"
export function FineDetail({ id }: { id: string }) {
  const resource = useResource<Fine>("/fine-cases/" + id),
    admin = useAdmin()
  const [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("")
  const c = resource.data
  const refresh = () => {
    setEditing(false)
    setError("")
    resource.reload()
  }
  return (
    <section className="space-y-6">
      <Link
        className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
        href="/fines"
      >
        Kembali ke daftar kejadian
      </Link>
      <LoadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      >
        {c && (
          <>
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="mb-2 text-sm text-foreground/65">
                  Kejadian · {caseLabels[c.status]} · Versi {c.version}
                </p>
                <h1 className="text-3xl font-semibold">{c.displayCode}</h1>
                <p className="mt-3 text-sm text-foreground/65">
                  {wib(c.occurredAt)}
                </p>
              </div>
              {!editing && c.status !== "VOIDED" && (
                <Button
                  variant="outline"
                  className="min-h-11"
                  onClick={() => {
                    setEditing(true)
                    setError("")
                    setMessage("")
                  }}
                >
                  {c.status === "DRAFT"
                    ? "Lengkapi draft"
                    : c.canEditFinancial
                      ? "Koreksi kejadian"
                      : "Ubah catatan"}
                </Button>
              )}
            </div>
            <Feedback error={error} />
            <Feedback message={message} />
            {editing ? (
              <FineForm
                key={c.version}
                initial={c}
                onCancel={refresh}
                onSaved={() => {
                  setMessage("Perubahan berhasil disimpan.")
                  refresh()
                }}
              />
            ) : (
              <>
                <div className="space-y-3 rounded-xl border bg-background p-4 sm:p-6">
                  <h2 className="text-xl font-semibold break-words">
                    {c.violationNameSnapshot ??
                      c.violationType?.name ??
                      "Jenis belum dipilih"}
                  </h2>
                  <p className="text-xs text-foreground/65">
                    {c.violationCodeSnapshot ??
                      c.violationType?.code ??
                      "Kode belum tersedia"}
                    {c.violationCategorySnapshot
                      ? " · " +
                        categories[
                          c.violationCategorySnapshot as keyof typeof categories
                        ]
                      : ""}
                  </p>
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {c.description ?? "Deskripsi belum diisi."}
                  </p>
                  {c.status === "DRAFT" && (
                    <p className="text-sm text-foreground/65">
                      Draft belum menambah saldo. Posting memerlukan tanggal,
                      jenis dan karyawan aktif, deskripsi, serta nominal
                      lengkap.
                    </p>
                  )}
                  {c.status === "VOIDED" && (
                    <p className="text-sm break-words whitespace-pre-wrap">
                      Alasan pembatalan: {c.voidReason}
                    </p>
                  )}
                </div>
                <section className="rounded-xl border bg-background">
                  <h2 className="border-b p-4 text-lg font-semibold sm:px-6">
                    Alokasi peserta
                  </h2>
                  {c.members.length === 0 ? (
                    <p className="p-6 text-sm text-foreground/65">
                      Belum ada peserta.
                    </p>
                  ) : (
                    <div className="divide-y">
                      {c.members.map((m, i) => (
                        <div key={m.id} className="space-y-3 p-4 sm:p-6">
                          <div className="flex flex-wrap justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium break-words">
                                {i + 1}. {m.employeeDisplayName}
                              </p>
                              <p className="mt-1 text-xs text-foreground/65">
                                {!m.employeeId
                                  ? "Belum terhubung dengan karyawan"
                                  : m.settlementStatus
                                    ? settlementLabels[
                                        m.settlementStatus as keyof typeof settlementLabels
                                      ]
                                    : m.employeeIsActive
                                      ? "Karyawan aktif"
                                      : "Karyawan diarsipkan"}
                              </p>
                            </div>
                            <p className="font-semibold">
                              {m.assignedAmount === null
                                ? "Nominal belum diisi"
                                : money(m.assignedAmount)}
                            </p>
                          </div>
                          {c.status === "POSTED" && (
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/65">
                              <p>Dibayar {money(m.netPaidAmount)}</p>
                              <p>Sisa {money(m.outstandingAmount)}</p>
                            </div>
                          )}
                          {c.status === "POSTED" &&
                            BigInt(m.outstandingAmount) > BigInt(0) && (
                              <LedgerAction
                                mode="payment"
                                target={m.id}
                                name={m.employeeDisplayName}
                                amount={m.outstandingAmount}
                                onRefresh={resource.reload}
                                onDone={() => {
                                  setMessage(
                                    "Pembayaran berhasil dicatat. Saldo sudah diperbarui."
                                  )
                                  resource.reload()
                                }}
                              />
                            )}
                          {m.entries.length > 0 && (
                            <details className="text-sm">
                              <summary className="cursor-pointer py-3 focus-visible:outline-2">
                                Histori ledger ({m.entries.length})
                              </summary>
                              <div className="divide-y">
                                {m.entries.map((entry) => (
                                  <div
                                    className="space-y-1 py-3"
                                    key={entry.id}
                                  >
                                    <p>
                                      {entry.kind === "PAYMENT"
                                        ? "Pembayaran"
                                        : "Pembalikan"}{" "}
                                      · {money(entry.amount)}
                                    </p>
                                    <p className="text-xs text-foreground/65">
                                      {wib(entry.effectiveAt)} ·{" "}
                                      {entry.method
                                        ? methods[entry.method]
                                        : "Pembalikan"}
                                    </p>
                                    <p className="text-xs break-all text-foreground/65">
                                      Dicatat {wib(entry.createdAt)} · Aktor{" "}
                                      {entry.recordedBy}
                                    </p>
                                    <Link
                                      className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                                      href={"/payments/" + entry.id}
                                    >
                                      Detail transaksi
                                    </Link>
                                    {entry.originalPaymentId && (
                                      <Link
                                        className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                                        href={
                                          "/payments/" + entry.originalPaymentId
                                        }
                                      >
                                        Pembayaran asli
                                      </Link>
                                    )}
                                    {c.status === "POSTED" &&
                                      entry.kind === "PAYMENT" &&
                                      !m.entries.some(
                                        (other) =>
                                          other.originalPaymentId === entry.id
                                      ) && (
                                        <LedgerAction
                                          mode="reverse"
                                          target={entry.id}
                                          name={m.employeeDisplayName}
                                          amount={String(entry.amount)}
                                          originalEffectiveAt={
                                            entry.effectiveAt
                                          }
                                          onRefresh={resource.reload}
                                          onDone={() => {
                                            setMessage(
                                              "Pembayaran berhasil dibalik. Saldo sudah diperbarui."
                                            )
                                            resource.reload()
                                          }}
                                        />
                                      )}
                                    {entry.note && (
                                      <p className="break-words">
                                        {entry.note}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <dl className="grid gap-5 border-t bg-muted/30 p-4 sm:grid-cols-3 sm:p-6">
                    <div>
                      <dt className="text-xs text-foreground/65">
                        {c.status === "DRAFT"
                          ? "Preview alokasi"
                          : "Total denda aktif"}
                      </dt>
                      <dd className="mt-2 text-2xl font-semibold">
                        {money(
                          c.status === "DRAFT"
                            ? c.previewAmount
                            : c.assessedAmount
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-foreground/65">
                        Dibayar bersih
                      </dt>
                      <dd className="mt-2 text-xl">{money(c.netPaidAmount)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-foreground/65">
                        Sisa denda aktif
                      </dt>
                      <dd className="mt-2 text-xl">
                        {money(c.outstandingAmount)}
                      </dd>
                    </div>
                  </dl>
                  {c.settlementStatus && (
                    <p className="border-t px-6 py-4 text-sm">
                      Status pembayaran:{" "}
                      {
                        settlementLabels[
                          c.settlementStatus as keyof typeof settlementLabels
                        ]
                      }
                    </p>
                  )}
                </section>
                {c.sourceText && (
                  <details className="rounded-xl border bg-background p-4">
                    <summary className="cursor-pointer py-2 text-sm focus-visible:outline-2">
                      Teks sumber
                    </summary>
                    <p className="mt-3 text-sm break-words whitespace-pre-wrap">
                      {c.sourceText}
                    </p>
                  </details>
                )}
                <div className="space-y-2 text-xs text-foreground/65">
                  <p>Dibuat {wib(c.createdAt)}</p>
                  {c.postedAt && <p>Diposting {wib(c.postedAt)}</p>}
                  {c.voidedAt && <p>Dibatalkan {wib(c.voidedAt)}</p>}
                  {c.hasLedgerHistory && (
                    <p>
                      Histori ledger tersedia. Koreksi finansial dikunci
                      meskipun pembayaran sudah dibalik.
                    </p>
                  )}
                </div>
                {c.status !== "VOIDED" && (
                  <div className="flex flex-wrap gap-3 border-t pt-5">
                    {c.status === "DRAFT" && (
                      <Button
                        className="min-h-11"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true)
                          setError("")
                          try {
                            await api(`/fine-cases/${id}/post`, {
                              method: "POST",
                              headers: { "X-CSRF-Token": admin.csrfToken },
                              body: JSON.stringify({ version: c.version }),
                            })
                            setMessage("Kejadian berhasil diposting.")
                            resource.reload()
                          } catch (err) {
                            setError((err as Error).message)
                          } finally {
                            setBusy(false)
                          }
                        }}
                      >
                        {busy ? "Memproses…" : "Posting draft"}
                      </Button>
                    )}
                    <VoidAction
                      c={c}
                      onDone={() => {
                        setMessage("Kejadian berhasil dibatalkan.")
                        resource.reload()
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </LoadState>
    </section>
  )
}
function VoidAction({ c, onDone }: { c: Fine; onDone: () => void }) {
  const admin = useAdmin(),
    [open, setOpen] = useState(false),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) {
          setOpen(v)
          setError("")
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="min-h-11"
            disabled={!c.canVoid}
          />
        }
      >
        Batalkan kejadian
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Batalkan {c.displayCode}?</DialogTitle>
          <DialogDescription>
            Kejadian yang dibatalkan tidak dapat diubah atau diposting ulang.
            Histori tetap tersimpan.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (busy) return
            setBusy(true)
            setError("")
            try {
              await api(`/fine-cases/${c.id}/void`, {
                method: "POST",
                headers: { "X-CSRF-Token": admin.csrfToken },
                body: JSON.stringify({ version: c.version, reason }),
              })
              setOpen(false)
              onDone()
            } catch (err) {
              setError((err as Error).message)
            } finally {
              setBusy(false)
            }
          }}
        >
          <Feedback error={error} />
          <label className="block space-y-2 text-sm">
            <span>Alasan pembatalan</span>
            <textarea
              className={selectClass + " h-24 py-3"}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={5}
              maxLength={500}
              disabled={busy}
            />
          </label>
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Kembali
            </Button>
            <Button
              type="submit"
              className="min-h-11"
              disabled={busy || reason.trim().length < 5}
            >
              {busy ? "Membatalkan…" : "Konfirmasi pembatalan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
