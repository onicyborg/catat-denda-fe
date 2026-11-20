"use client"
import { useState } from "react"
import { useAdmin } from "../layout"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
export default function Settings() {
  const admin = useAdmin()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  return (
    <section className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Akun admin</h1>
      <p className="break-all">{admin.email}</p>
      <p>Rupiah (IDR) · Waktu Indonesia Barat</p>
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
        <label className="block space-y-2">
          Kata sandi lama
          <input
            className="block w-full rounded-md border p-3 focus-visible:outline-2"
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            required
            maxLength={256}
          />
        </label>
        <label className="block space-y-2">
          Kata sandi baru (minimal 12 karakter)
          <input
            className="block w-full rounded-md border p-3 focus-visible:outline-2"
            type="password"
            name="newPassword"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={256}
          />
        </label>
        <p role="status">{message}</p>
        <Button type="submit" disabled={busy}>
          {busy ? "Menyimpan…" : "Simpan kata sandi"}
        </Button>
      </form>
    </section>
  )
}
