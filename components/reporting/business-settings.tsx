"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/lib/api"
import { useAdmin } from "@/components/admin-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Feedback,
  FieldError,
  LoadState,
  fieldClass,
  selectClass,
  useResource,
} from "@/components/master/shared"
import type { SettingsData } from "@/lib/reporting"
const schema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Nama usaha minimal 2 karakter.")
    .max(150, "Nama usaha maksimal 150 karakter."),
  finePolicyReference: z
    .string()
    .trim()
    .max(2000, "Referensi maksimal 2.000 karakter."),
})
export function BusinessSettings() {
  const result = useResource<SettingsData>("/settings"),
    [message, setMessage] = useState("")
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Pengaturan usaha</h2>
      <LoadState
        loading={result.loading}
        error={result.error}
        retry={result.reload}
      >
        {result.data && (
          <SettingsForm
            key={result.data.version}
            value={result.data}
            onSaved={() => {
              setMessage("Pengaturan usaha berhasil disimpan.")
              window.dispatchEvent(new Event("settings-updated"))
              result.reload()
            }}
            onReload={result.reload}
          />
        )}
      </LoadState>
      <Feedback message={message} />
    </section>
  )
}
function SettingsForm({
  value,
  onSaved,
  onReload,
}: {
  value: SettingsData
  onSaved: () => void
  onReload: () => void
}) {
  const admin = useAdmin(),
    [error, setError] = useState("")
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: value.businessName,
      finePolicyReference: value.finePolicyReference ?? "",
    },
  })
  return (
    <form
      className="space-y-4 rounded-xl border bg-background p-4 sm:p-6"
      onSubmit={handleSubmit(async (values) => {
        setError("")
        try {
          await api("/settings", {
            method: "PATCH",
            headers: { "X-CSRF-Token": admin.csrfToken },
            body: JSON.stringify({
              ...values,
              finePolicyReference: values.finePolicyReference || null,
              version: value.version,
            }),
          })
          onSaved()
        } catch (err) {
          setError((err as Error).message)
        }
      })}
    >
      <label className="block space-y-2 text-sm">
        <span>Nama usaha</span>
        <Input
          {...register("businessName")}
          className={fieldClass}
          maxLength={150}
          aria-invalid={!!errors.businessName}
          aria-describedby="business-name-error"
          disabled={isSubmitting}
        />
      </label>
      <FieldError id="business-name-error">
        {errors.businessName?.message}
      </FieldError>
      <label className="block space-y-2 text-sm">
        <span>Referensi kebijakan denda (opsional)</span>
        <textarea
          {...register("finePolicyReference")}
          className={selectClass + " h-28 py-3"}
          maxLength={2000}
          aria-invalid={!!errors.finePolicyReference}
          disabled={isSubmitting}
        />
      </label>
      <FieldError id="business-policy-error">
        {errors.finePolicyReference?.message}
      </FieldError>
      <p className="text-sm text-foreground/65">
        Bahasa Indonesia · Rupiah (IDR) · Asia/Jakarta. Mata uang dan zona waktu
        tetap pada versi ini.
      </p>
      <Feedback error={error} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="min-h-11" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan…" : "Simpan pengaturan usaha"}
        </Button>
        {error && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={isSubmitting}
            onClick={onReload}
          >
            Muat pengaturan terbaru
          </Button>
        )}
      </div>
    </form>
  )
}
export function BusinessBrand() {
  const [name, setName] = useState("Catat Denda")
  useEffect(() => {
    let active = true
    const refresh = () => {
      void api<SettingsData>("/settings")
        .then((value) => {
          if (active) setName(value.businessName)
        })
        .catch(() => {})
    }
    refresh()
    window.addEventListener("settings-updated", refresh)
    window.addEventListener("focus", refresh)
    return () => {
      active = false
      window.removeEventListener("settings-updated", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [])
  return (
    <Link
      href="/dashboard"
      className="inline-flex min-h-11 min-w-0 flex-1 items-center font-semibold [overflow-wrap:anywhere] break-words"
    >
      <span
        title={name}
        className="line-clamp-2 min-w-0 flex-1 [overflow-wrap:anywhere] break-words"
      >
        {name}
      </span>
    </Link>
  )
}
