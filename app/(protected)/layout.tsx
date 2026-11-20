"use client"
import { AdminContext } from "@/components/admin-context"
import { WorkspaceShell } from "@/components/workspace/shell"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { api, type Admin } from "@/lib/api"
export default function Protected({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true
    let pending = false
    const load = () => {
      if (pending || !active) return
      pending = true
      return api<Admin>("/auth/me")
        .then((user) => {
          if (active) {
            setAdmin(user)
            setError("")
          }
        })
        .catch((err) => {
          if (active) {
            setError(err.message)
          }
        })
        .finally(() => {
          pending = false
        })
    }
    const expire = () => {
      active = false
      setAdmin(null)
    }
    window.addEventListener("session-expired", expire)
    void load()
    const onFocus = () => {
      void load()
    }
    window.addEventListener("focus", onFocus)
    const timer = setInterval(() => {
      void load()
    }, 60000)
    return () => {
      active = false
      window.removeEventListener("session-expired", expire)
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
    <AdminContext value={admin}>
      <WorkspaceShell
        admin={admin}
        loggingOut={loggingOut}
        error={error}
        onLogout={async () => {
          setLoggingOut(true)
          try {
            await api("/auth/logout", {
              method: "POST",
              headers: { "X-CSRF-Token": admin.csrfToken },
            })
            window.dispatchEvent(new Event("session-expired"))
            window.location.replace("/login")
          } catch (err) {
            setError((err as Error).message)
          } finally {
            setLoggingOut(false)
          }
        }}
      >
        {children}
      </WorkspaceShell>
    </AdminContext>
  )
}
