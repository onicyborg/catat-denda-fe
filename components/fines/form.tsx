"use client"
import Link from "next/link"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Feedback, fieldClass, selectClass } from "@/components/master/shared"
import { useAdmin } from "@/components/admin-context"
import { api, ApiError } from "@/lib/api"
import { localWib, isoWib, money, type Fine } from "@/lib/fines"
import type { Employee, Violation } from "@/lib/master"
import { Disclosure } from "@/components/workspace/disclosure"
import { Picker } from "./picker"
const schema = z.object({
  occurredAt: z
    .string()
    .refine(
      (value) =>
        !value ||
        (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
          Number.isFinite(Date.parse(value + ":00+07:00"))),
      "Tanggal dan waktu tidak valid."
    ),
  violationTypeId: z.string(),
  description: z
    .string()
    .trim()
    .max(1000, "Deskripsi maksimal 1.000 karakter."),
  sourceText: z.string().max(10000, "Teks sumber maksimal 10.000 karakter."),
  members: z
    .array(
      z.object({
        employeeId: z.string(),
        rawEmployeeName: z.string().max(120),
        name: z.string(),
        amount: z
          .string()
          .refine(
            (v) =>
              v === "" ||
              (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 100000000),
            "Isi nominal bulat Rp1 sampai Rp100.000.000, atau kosongkan untuk draft."
          ),
        manual: z.boolean(),
      })
    )
    .max(20),
})
type Values = z.infer<typeof schema>
type Payload = {
  occurredAt: string | null
  violationTypeId: string | null
  description: string | null
  sourceText?: string | null
  members: {
    employeeId: string | null
    rawEmployeeName: string | null
    assignedAmount: number | null
  }[]
}
export function FineForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: Fine
  onCancel?: () => void
  onSaved?: (c: Fine) => void
}) {
  const admin = useAdmin(),
    router = useRouter()
  const [saved, setSaved] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [type, setType] = useState<Violation | null>(initial?.violationType ?? null)
  const pending = useRef<{ key: string; payload: Payload } | null>(null),
    sending = useRef(false),
    uncertain = useRef(false)
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      occurredAt: initial?.occurredAt
        ? localWib(initial.occurredAt)
        : initial
          ? ""
          : localWib(new Date().toISOString()),
      violationTypeId: initial?.violationTypeId ?? "",
      description: initial?.description ?? "",
      sourceText: initial?.sourceText ?? "",
      members:
        initial?.members.map((m) => ({
          employeeId: m.employeeId ?? "",
          rawEmployeeName: m.rawEmployeeName ?? "",
          name: m.employeeDisplayName,
          amount: m.assignedAmount?.toString() ?? "",
          manual: true,
        })) ?? [],
    },
  })
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "members",
  })
  const values = useWatch({ control }),
    locked = saved?.status === "POSTED" && !saved.canEditFinancial
  const members = values.members ?? []
  const total = members.reduce(
    (sum, m) =>
      sum + (m.amount && /^\d+$/.test(m.amount) ? BigInt(m.amount) : BigInt(0)),
    BigInt(0)
  )
  const headers = { "X-CSRF-Token": admin.csrfToken }
  const finish = (c: Fine) => {
    if (onSaved) onSaved(c)
    else router.push("/fines/" + c.id)
  }
  const save = async (v: Values, posting: boolean) => {
    if (sending.current) return
    sending.current = true
    setBusy(true)
    setError("")
    let current = saved
    const payload: Payload = {
      occurredAt: isoWib(v.occurredAt),
      violationTypeId: v.violationTypeId || null,
      description: v.description || null,
      ...(current?.status === "POSTED"
        ? {}
        : { sourceText: v.sourceText || null }),
      members: v.members.map((m) => ({
        employeeId: m.employeeId || null,
        rawEmployeeName: m.rawEmployeeName || null,
        assignedAmount: m.amount === "" ? null : Number(m.amount),
      })),
    }
    try {
      if (uncertain.current && current) {
        const latest = await api<Fine>("/fine-cases/" + current.id)
        if (latest.status === "POSTED" && current.status === "DRAFT") {
          finish(latest)
          return
        }
        if (latest.version !== current.version) {
          throw new ApiError(
            "Hasil penyimpanan sebelumnya mungkin sudah diterapkan. Input Anda tetap tersimpan di form. Buka detail terbaru untuk meninjau perubahan sebelum mengirim ulang.",
            409
          )
        }
        uncertain.current = false
      }
      if (!current) {
        pending.current ??= { key: crypto.randomUUID(), payload }
        current = await api<Fine>("/fine-cases", {
          method: "POST",
          headers: { ...headers, "Idempotency-Key": pending.current.key },
          body: JSON.stringify(pending.current.payload),
        })
        setSaved(current)
        if (current.status !== "DRAFT") {
          pending.current = null
          finish(current)
          return
        }
        // A retry first recovers the original draft, then applies edits made after the connection failed.
        if (
          JSON.stringify(pending.current.payload) !== JSON.stringify(payload)
        ) {
          uncertain.current = true
          current = await api<Fine>("/fine-cases/" + current.id, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ ...payload, version: current.version }),
          })
          setSaved(current)
          uncertain.current = false
        }
        pending.current = null
      } else {
        uncertain.current = true
        current = await api<Fine>("/fine-cases/" + current.id, {
          method: "PATCH",
          headers,
          body: JSON.stringify(
            locked
              ? { description: v.description || null, version: current.version }
              : { ...payload, version: current.version }
          ),
        })
        setSaved(current)
        uncertain.current = false
      }
      if (posting) {
        uncertain.current = true
        current = await api<Fine>(`/fine-cases/${current.id}/post`, {
          method: "POST",
          headers,
          body: JSON.stringify({ version: current.version }),
        })
        setSaved(current)
        uncertain.current = false
      }
      finish(current)
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        uncertain.current = false
        if (!saved && err.status !== 409) pending.current = null
      }
      setError(
        (err as Error).message +
          (err instanceof ApiError && err.status === 409
            ? " Input tidak dihapus. Tinjau detail terbaru."
            : "")
      )
    } finally {
      setBusy(false)
      sending.current = false
    }
  }
  const selectType = (item: Employee | Violation) => {
    const t = item as Violation
    if (t.id === getValues("violationTypeId")) return
    setType(t)
    if (!getValues("description").trim()) setValue("description", t.name)
    setValue("violationTypeId", t.id)
    getValues("members").forEach((m, i) => {
      if (!m.manual)
        setValue(`members.${i}.amount`, String(t.defaultAmountPerPerson))
    })
    setNotice(
      "Tarif jenis baru diterapkan ke karyawan yang dipilih. Nominal yang Anda ubah sendiri tetap digunakan."
    )
  }
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        void handleSubmit((v) => save(v, false))(event)
      }}
    >
      <Feedback error={error} />
      <Feedback message={notice} />
      {saved?.status === "DRAFT" && (
        <p className="text-sm">
          Draft tersimpan:{" "}
          <Link
            className="underline underline-offset-4"
            href={"/fines/" + saved.id}
          >
            {saved.displayCode}
          </Link>
          . Silakan lanjutkan dari draft ini.
        </p>
      )}
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="text-sm text-destructive">
          Periksa isian. Nominal harus bilangan bulat Rp1 sampai Rp100.000.000
          atau kosong untuk draft. Deskripsi maksimal 1.000 karakter.
        </p>
      )}
      <fieldset
        disabled={busy}
        className="min-w-0 space-y-6 disabled:opacity-65"
      >
        {!locked && (
          <div className="space-y-5 rounded-xl border bg-background p-4 sm:p-6">
            <h2 className="text-lg font-semibold">1. Pilih kesalahan</h2>
            <div className="grid gap-5">
              <div className="space-y-2">
                <p className="text-sm">Jenis kesalahan</p>
                <Picker
                  kind="violation-types"
                  label={
                    type
                      ? `Pilih jenis kesalahan: ${type.name}`
                      : "Pilih jenis kesalahan"
                  }
                  onPick={selectType}
                />
                {type && (
                  <p className="text-xs text-foreground/65">
                    Tarif default {money(type.defaultAmountPerPerson)} per
                    peserta.
                  </p>
                )}
                <input type="hidden" {...register("violationTypeId")} />
              </div>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="fine-description" className="text-sm">
            Deskripsi kejadian
          </label>
          <textarea
            id="fine-description"
            className={selectClass + " h-20 py-3"}
            maxLength={1000}
            {...register("description")}
          />
          <p className="text-xs text-foreground/65">
            Terisi dari jenis kesalahan. Anda bisa menambahkan rincian.{" "}
            {locked
              ? "Riwayat pembayaran sudah ada; hanya deskripsi yang dapat dikoreksi."
              : "Data belum lengkap dapat disimpan sebagai draft."}
          </p>
        </div>
        {!locked && (
          <section className="space-y-4 rounded-xl border bg-background p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">2. Pilih karyawan</h2>
                <p className="mt-1 text-sm text-foreground/65">
                  {fields.length} karyawan dipilih
                </p>
              </div>
              <Picker
                kind="employees"
                label="Pilih karyawan"
                selected={members.flatMap((m) =>
                  m.employeeId ? [m.employeeId] : []
                )}
                disabled={fields.length >= 20}
                onPick={(item) => {
                  const e = item as Employee
                  if (
                    getValues("members").some((m) => m.employeeId === e.id) ||
                    getValues("members").length >= 20
                  )
                    return
                  append({
                    employeeId: e.id,
                    rawEmployeeName: "",
                    name: e.displayName,
                    amount: type ? String(type.defaultAmountPerPerson) : "",
                    manual: false,
                  })
                }}
              />
            </div>
            {fields.length === 0 && (
              <p className="rounded-lg border border-dashed p-5 text-sm text-foreground/65">
                Pilih karyawan. Nominal otomatis mengikuti jenis kesalahan.
              </p>
            )}
            <div className="divide-y">
              {fields.map((field, i) => (
                <div
                  key={field.id}
                  className="grid min-w-0 gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
                >
                  <div className="min-w-0 space-y-2">
                    <p className="font-medium break-words">
                      {i + 1}.{" "}
                      {members[i]?.employeeId
                        ? members[i]?.name
                        : "Peserta belum terhubung"}
                    </p>
                    {!members[i]?.employeeId && (
                      <>
                        <label className="block space-y-2 text-sm">
                          <span>Nama dari sumber {i + 1}</span>
                          <Input
                            className={fieldClass}
                            {...register(`members.${i}.rawEmployeeName`)}
                          />
                        </label>
                        <Picker
                          kind="employees"
                          label="Hubungkan karyawan"
                          selected={members.flatMap((m) =>
                            m.employeeId ? [m.employeeId] : []
                          )}
                          onPick={(item) => {
                            const e = item as Employee
                            update(i, {
                              ...getValues(`members.${i}`),
                              employeeId: e.id,
                              name: e.displayName,
                            })
                          }}
                        />
                      </>
                    )}
                    <p className="text-xs text-foreground/65">
                      {members[i]?.manual
                        ? "Nominal diubah manual"
                        : "Nominal otomatis"}
                    </p>
                  </div>
                  <label className="block space-y-2 text-sm">
                    <span>Nominal peserta {i + 1} (Rp)</span>
                    <Input
                      className={fieldClass}
                      inputMode="numeric"
                      {...register(`members.${i}.amount`, {
                        onChange: () => setValue(`members.${i}.manual`, true),
                      })}
                      aria-invalid={!!errors.members?.[i]?.amount}
                    />
                  </label>
                  <Button
                    type="button"
                    className="min-h-11 self-end"
                    variant="outline"
                    onClick={() => remove(i)}
                    aria-label={`Hapus peserta ${i + 1}`}
                  >
                    Hapus
                  </Button>
                </div>
              ))}
            </div>
            <Disclosure
              title="Karyawan belum ada di daftar?"
              summary="Simpan nama dari sumber sebagai draft"
            >
              {" "}
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 whitespace-normal"
                disabled={fields.length >= 20}
                onClick={() =>
                  append({
                    employeeId: "",
                    rawEmployeeName: "",
                    name: "",
                    amount: "",
                    manual: true,
                  })
                }
              >
                Tambah nama dari sumber untuk draft
              </Button>
            </Disclosure>{" "}
            <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
              <span className="text-sm">
                {saved?.status === "POSTED"
                  ? "Total alokasi koreksi"
                  : "Preview alokasi draft"}
              </span>
              <output className="text-2xl font-semibold" aria-live="polite">
                {money(total.toString())}
              </output>
            </div>
            <p className="text-xs text-foreground/65">
              Periksa nominal sebelum menyimpan. Draft belum menambah saldo
              denda.
            </p>
          </section>
        )}
        <Disclosure
          title="Tanggal dan catatan tambahan"
          summary="Tanggal hari ini sudah terisi untuk pencatatan baru"
        >
          {!locked && (
            <label className="space-y-2 text-sm">
              <span>Tanggal dan waktu (WIB)</span>
              <Input
                type="datetime-local"
                className={fieldClass + " w-full min-w-0"}
                {...register("occurredAt")}
              />
            </label>
          )}{" "}
          {saved?.status !== "POSTED" && (
            <label className="block space-y-2 text-sm">
              <span>Teks sumber (opsional)</span>
              <textarea
                className={selectClass + " h-24 py-3"}
                maxLength={10000}
                {...register("sourceText")}
              />
            </label>
          )}
        </Disclosure>
        <div className="flex flex-wrap gap-3 border-t bg-background pt-5">
          <Button
            type="submit"
            className="min-h-11"
            variant={saved?.status === "POSTED" ? "default" : "outline"}
          >
            {busy
              ? "Menyimpan…"
              : saved?.status === "POSTED"
                ? locked
                  ? "Simpan catatan"
                  : "Simpan koreksi"
                : "Simpan draft"}
          </Button>
          {saved?.status !== "POSTED" && (
            <Button
              type="button"
              className="min-h-11"
              onClick={() => {
                void handleSubmit((v) => save(v, true))()
              }}
            >
              {busy ? "Memproses…" : "Simpan denda"}
            </Button>
          )}
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              onClick={onCancel}
            >
              Batal mengubah
            </Button>
          )}
        </div>
      </fieldset>
    </form>
  )
}
