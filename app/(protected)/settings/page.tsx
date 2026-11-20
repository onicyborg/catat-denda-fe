"use client"
import { BusinessSettings } from "@/components/reporting/business-settings"
import { useState } from "react"
import { useAdmin } from "@/components/admin-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { fieldClass } from "@/components/master/shared"
import { PageHeader } from "@/components/workspace/page-header"
export default function Settings() {
  const admin = useAdmin()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Administrasi"
        title="Pengaturan"
        description="Kelola identitas usaha dan akses akun administrator."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <BusinessSettings />
        <div className="min-w-0 space-y-5 rounded-xl border bg-background p-5 sm:p-6">
          <div className="space-y-2 border-b pb-5">
            <h2 className="text-base font-semibold">Akun admin</h2>
            <p className="text-sm font-medium break-all">
              {admin.username ?? admin.email}
            </p>
            <p className="text-xs text-foreground/65">
              Rupiah (IDR) · Waktu Indonesia Barat
            </p>
          </div>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              const form = e.currentTarget
              setBusy(true)
              setMessage("")
              try {
                await api("/auth/change-password", {
                  method: "POST",
                  headers: { "X-CSRF-Token": admin.csrfToken },
                  body: JSON.stringify(Object.fromEntries(new FormData(form))),
                })
                form.reset()
                setMessage("Kata sandi diubah. Sesi lain telah dicabut.")
              } catch (err) {
                setMessage((err as Error).message)
              } finally {
                setBusy(false)
              }
            }}
          >
            <h2 className="text-lg font-semibold">Ubah kata sandi</h2>
            <label className="block space-y-2 text-sm">
              Kata sandi lama
              <input
                className={`${fieldClass} block w-full border px-3 focus-visible:outline-2`}
                type="password"
                name="currentPassword"
                autoComplete="current-password"
                required
                maxLength={256}
              />
            </label>
            <label className="block space-y-2 text-sm">
              Kata sandi baru (minimal 12 karakter)
              <input
                className={`${fieldClass} block w-full border px-3 focus-visible:outline-2`}
                type="password"
                name="newPassword"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={256}
              />
            </label>
            <p role="status" className="text-sm">
              {message}
            </p>
            <Button type="submit" className="min-h-11" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan kata sandi"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
