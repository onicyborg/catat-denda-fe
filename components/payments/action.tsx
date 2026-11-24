"use client"
import { useRef, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  FieldError,
  fieldClass,
  selectClass,
} from "@/components/master/shared"
import { Disclosure } from "@/components/workspace/disclosure"
import { useAdmin } from "@/components/admin-context"
import { api, ApiError } from "@/lib/api"
import { money } from "@/lib/fines"
import {
  ledgerLocal,
  ledgerIso,
  validLedgerTime,
  methods,
  type Payment,
} from "@/lib/payments"
type Pending = { key: string; body: Record<string, string | number | null> }
type Props = {
  mode: "payment" | "reverse"
  target: string
  name: string
  amount: string
  originalEffectiveAt?: string
  onDone: (entry: Payment) => void
  onRefresh: () => void
}
export function LedgerAction(props: Props) {
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState<Pending | null>(null),
    [busy, setBusy] = useState(false)
  const reverse = props.mode === "reverse"
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) setOpen(value)
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant={reverse ? "outline" : "default"}
            className="min-h-11 whitespace-normal"
          />
        }
      >
        {pending
          ? "Lanjutkan konfirmasi"
          : reverse
            ? "Balikkan pembayaran"
            : "Catat pembayaran"}
      </DialogTrigger>
      <DialogContent
        showCloseButton={!busy}
        className="max-h-[85dvh] grid-cols-[minmax(0,1fr)] overflow-y-auto rounded-2xl"
      >
        <DialogHeader className="min-w-0">
          <DialogTitle>
            {reverse ? "Balikkan pembayaran" : "Catat pembayaran"}
          </DialogTitle>
          <DialogDescription className="break-words">
            {props.name}.{" "}
            {reverse
              ? "Pembalikan penuh menjaga transaksi asli dalam histori."
              : "Nominal dicatat untuk alokasi peserta ini."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <LedgerForm
            {...props}
            pending={pending}
            setPending={setPending}
            busy={busy}
            setBusy={setBusy}
            close={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
const schema = z.object({
  amount: z.string(),
  method: z.enum(["CASH", "TRANSFER", "OTHER"]),
  effectiveAt: z
    .string()
    .refine(validLedgerTime, "Isi tanggal dan waktu yang valid."),
  note: z.string().trim().max(1000, "Catatan maksimal 1.000 karakter."),
  reason: z.string().trim().max(500, "Alasan maksimal 500 karakter."),
})
type Values = z.infer<typeof schema>
function LedgerForm({
  mode,
  target,
  name,
  amount,
  originalEffectiveAt,
  onDone,
  onRefresh,
  pending,
  setPending,
  busy,
  setBusy,
  close,
}: Props & {
  pending: Pending | null
  setPending: (p: Pending | null) => void
  busy: boolean
  setBusy: (v: boolean) => void
  close: () => void
}) {
  const admin = useAdmin(),
    sending = useRef(false),
    [error, setError] = useState("")
  const [initialDate] = useState(() => {
    const now = Date.now()
    const minute = Math.floor(now / 60000) * 60000
    const original = originalEffectiveAt
      ? new Date(originalEffectiveAt).getTime()
      : 0
    return ledgerLocal(
      new Date(
        mode === "reverse" && original > minute && original <= now
          ? original
          : minute
      ).toISOString()
    )
  })
  const reverse = mode === "reverse",
    locked = !!pending
  const {
    register,
    handleSubmit,
    control,
    setError: fieldError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: pending?.body.amount?.toString() ?? amount,
      method: (pending?.body.method as Values["method"]) ?? "CASH",
      effectiveAt:
        typeof pending?.body.effectiveAt === "string"
          ? ledgerLocal(pending.body.effectiveAt)
          : initialDate,
      note: typeof pending?.body.note === "string" ? pending.body.note : "",
      reason:
        typeof pending?.body.reason === "string" ? pending.body.reason : "",
    },
  })
  const typed = useWatch({ control, name: "amount" }),
    validAmount =
      /^\d+$/.test(typed) &&
      BigInt(typed) > BigInt(0) &&
      BigInt(typed) <= BigInt(amount) &&
      BigInt(typed) <= BigInt(100000000)
  const submit = async (values: Values) => {
    if (sending.current) return
    if (!pending && !reverse && !validAmount) {
      fieldError("amount", {
        message: "Isi nominal bulat positif yang tidak melebihi sisa denda.",
      })
      return
    }
    if (!pending && reverse && values.reason.length < 5) {
      fieldError("reason", { message: "Alasan minimal 5 karakter." })
      return
    }
    sending.current = true
    setBusy(true)
    setError("")
    const attempt = pending ?? {
      key: crypto.randomUUID(),
      body: reverse
        ? { reason: values.reason, effectiveAt: ledgerIso(values.effectiveAt) }
        : {
            amount: Number(values.amount),
            method: values.method,
            effectiveAt: ledgerIso(values.effectiveAt),
            note: values.note || null,
          },
    }
    setPending(attempt)
    try {
      const entry = await api<Payment>(
        reverse
          ? `/payments/${target}/reverse`
          : `/fine-members/${target}/payments`,
        {
          method: "POST",
          headers: {
            "X-CSRF-Token": admin.csrfToken,
            "Idempotency-Key": attempt.key,
          },
          body: JSON.stringify(attempt.body),
        }
      )
      setPending(null)
      close()
      onDone(entry)
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status >= 400 &&
        err.status < 500 &&
        !err.retryable &&
        err.status !== 429
      )
        setPending(null)
      setError((err as Error).message)
    } finally {
      sending.current = false
      setBusy(false)
    }
  }
  return (
    <form
      className="min-w-0 space-y-5"
      onSubmit={(event) => {
        void handleSubmit(submit)(event)
      }}
    >
      <Feedback error={error} />
      {locked && !busy && (
        <Feedback message="Hasil permintaan belum terkonfirmasi. Ulangi konfirmasi untuk memeriksa transaksi yang sama. Isian dipertahankan agar tidak tercatat dua kali." />
      )}
      <p className="text-sm font-medium break-words">{name}</p>
      <dl className="rounded-lg border bg-muted/30 p-4">
        <dt className="text-xs text-foreground/65">
          {reverse ? "Nominal pembalikan penuh" : "Sisa sebelum pembayaran"}
        </dt>
        <dd className="mt-2 text-2xl font-semibold">{money(amount)}</dd>
      </dl>
      <fieldset
        disabled={busy || locked}
        className="min-w-0 space-y-4 disabled:opacity-65"
      >
        {!reverse && (
          <>
            <label className="block space-y-2 text-sm">
              <span>Nominal pembayaran (Rp)</span>
              <Input
                {...register("amount")}
                className={fieldClass}
                inputMode="numeric"
                maxLength={9}
                aria-invalid={!!errors.amount}
                aria-describedby="payment-amount-error"
                autoFocus
              />
            </label>
            <FieldError id="payment-amount-error">
              {errors.amount?.message}
            </FieldError>
            <div className="space-y-2 text-sm">
              <label htmlFor="payment-method">Metode pembayaran</label>
              <select
                id="payment-method"
                className={selectClass}
                {...register("method")}
              >
                {Object.entries(methods).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
        <label className="block space-y-2 text-sm">
          <span>
            {reverse ? "Tanggal pembalikan (WIB)" : "Tanggal pembayaran (WIB)"}
          </span>
          <Input
            className={fieldClass + " w-full min-w-0"}
            type="datetime-local"
            step="any"
            {...register("effectiveAt")}
            aria-invalid={!!errors.effectiveAt}
            aria-describedby="payment-date-error"
          />
        </label>
        <FieldError id="payment-date-error">
          {errors.effectiveAt?.message}
        </FieldError>
        {reverse ? (
          <>
            <label className="block space-y-2 text-sm">
              <span>Alasan pembalikan</span>
              <textarea
                className={selectClass + " h-24 py-3"}
                {...register("reason")}
                maxLength={500}
                aria-invalid={!!errors.reason}
                aria-describedby="payment-reason-error"
                autoFocus
              />
            </label>
            <FieldError id="payment-reason-error">
              {errors.reason?.message}
            </FieldError>
          </>
        ) : (
          <>
            <Disclosure title="Tambah catatan (opsional)">
              {" "}
              <label className="block space-y-2 text-sm">
                <span>Catatan pembayaran (opsional)</span>
                <textarea
                  className={selectClass + " h-20 py-3"}
                  {...register("note")}
                  maxLength={1000}
                />
              </label>
              <FieldError id="payment-note-error">
                {errors.note?.message}
              </FieldError>
            </Disclosure>
          </>
        )}
      </fieldset>
      {!reverse && (
        <div className="flex flex-wrap justify-between gap-2 border-t pt-4 text-sm">
          <p>Preview sisa sesudah</p>
          <output aria-live="polite" className="font-semibold">
            {validAmount
              ? money((BigInt(amount) - BigInt(typed)).toString())
              : "Periksa nominal"}
          </output>
        </div>
      )}
      <p className="text-xs text-foreground/65">
        {reverse
          ? "Nominal mengikuti pembayaran asli. Tanggal tidak boleh mendahului pembayaran asli atau berada di masa depan."
          : "Saldo final diperiksa server saat disimpan. Pembayaran tidak dapat dihapus; kesalahan diperbaiki melalui pembalikan."}
      </p>
      <div className="flex flex-wrap justify-end gap-3">
        {error && !locked && (
          <Button
            type="button"
            className="min-h-11"
            variant="outline"
            disabled={busy}
            onClick={() => {
              close()
              onRefresh()
            }}
          >
            Muat saldo terbaru
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={busy}
          onClick={close}
        >
          Tutup form
        </Button>
        <Button type="submit" className="min-h-11" disabled={busy}>
          {busy
            ? "Menyimpan…"
            : locked
              ? "Coba konfirmasi lagi"
              : reverse
                ? "Konfirmasi pembalikan"
                : "Simpan pembayaran"}
        </Button>
      </div>
    </form>
  )
}
