"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
export default function Login() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <section
        className="w-full max-w-sm space-y-6"
        aria-labelledby="login-title"
      >
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Catat Denda</p>
          <h1 id="login-title" className="text-2xl font-semibold">
            Masuk sebagai admin
          </h1>
          <p className="mt-2 text-sm">
            Gunakan akun yang disediakan pengelola usaha.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setError("")
            setBusy(true)
            const form = new FormData(e.currentTarget)
            try {
              await api("/auth/login", {
                method: "POST",
                body: JSON.stringify(Object.fromEntries(form)),
              })
              router.replace("/dashboard")
            } catch (err) {
              setError((err as Error).message)
            } finally {
              setBusy(false)
            }
          }}
        >
          <label className="block space-y-2">
            Email
            <input
              className="block w-full rounded-md border p-3 focus-visible:outline-2"
              name="email"
              type="email"
              autoComplete="username"
              maxLength={254}
              required
            />
          </label>
          <label className="block space-y-2">
            Kata sandi
            <input
              className="block w-full rounded-md border p-3 focus-visible:outline-2"
              name="password"
              type="password"
              autoComplete="current-password"
              maxLength={256}
              required
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Sedang masuk…" : "Masuk"}
          </Button>
        </form>
      </section>
    </main>
  )
}
