"use client"
import Link from "next/link"
import { useEffect, useState, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
import { api, type Admin } from "@/lib/api"
const Context = createContext<Admin | null>(null)
export const useAdmin = () => useContext(Context)!
export default function Protected({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true
    const load = () =>
      api<Admin>("/auth/me")
        .then((user) => {
          if (active) setAdmin(user)
        })
        .catch((err) => {
          if (active) {
            setAdmin(null)
            setError(err.message)
          }
        })
    void load()
    const onFocus = () => {
      setAdmin(null)
      void load()
    }
    window.addEventListener("focus", onFocus)
    const timer = setInterval(() => {
      void load()
    }, 60000)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener("focus", onFocus)
    }
  }, [])
  if (!admin)
    return (
      <main className="space-y-4 p-6">
        <p role="status">{error || "Memeriksa sesi…"}</p>
        {error && (
          <Button onClick={() => window.location.reload()}>Coba lagi</Button>
        )}
      </main>
    )
  return (
    <Context value={admin}>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b p-4">
        <Link className="font-semibold" href="/dashboard">
          Catat Denda
        </Link>
        <nav
          aria-label="Menu utama"
          className="flex flex-wrap items-center gap-4"
        >
          <Link href="/dashboard">Ringkasan</Link>
          <Link href="/settings">Akun</Link>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await api("/auth/logout", {
                  method: "POST",
                  headers: { "X-CSRF-Token": admin.csrfToken },
                })
                setAdmin(null)
                window.location.replace("/login")
              } catch (err) {
                setError((err as Error).message)
              }
            }}
          >
            Keluar
          </Button>
        </nav>
      </header>
      {error && (
        <p role="alert" className="p-4">
          {error}
        </p>
      )}
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </Context>
  )
}
