"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AdminContext } from "@/components/admin-context"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { api, type Admin } from "@/lib/api"
export default function Protected({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const links = [
    { href: "/dashboard", label: "Ringkasan" },
    { href: "/fines", label: "Kejadian denda" },
    { href: "/payments", label: "Pembayaran" },
    { href: "/employees", label: "Karyawan" },
    { href: "/mistake-types", label: "Jenis kesalahan" },
    { href: "/settings", label: "Akun" },
  ]
  const navigation = (close?: () => void) => (
    <nav aria-label="Menu utama" className="space-y-1">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={close}
          aria-current={
            pathname === link.href || pathname.startsWith(link.href + "/")
              ? "page"
              : undefined
          }
          className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-medium focus-visible:outline-2 ${pathname === link.href || pathname.startsWith(link.href + "/") ? "bg-primary/10 text-foreground" : "text-foreground/65 hover:bg-muted hover:text-foreground"}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
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
      <div className="min-h-svh bg-muted/30">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3 sm:px-6">
          <Link
            className="inline-flex min-h-11 items-center font-semibold"
            href="/dashboard"
          >
            Catat Denda
          </Link>
          <div className="flex items-center gap-2">
            <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline" className="min-h-11 lg:hidden" />
                }
              >
                Menu
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Menu</DialogTitle>
                  <DialogDescription>Ruang kerja Catat Denda</DialogDescription>
                </DialogHeader>
                {navigation(() => setMenuOpen(false))}
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={loggingOut}
              onClick={async () => {
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
              {loggingOut ? "Keluar…" : "Keluar"}
            </Button>
          </div>
        </header>
        {error && (
          <p role="alert" className="p-4">
            {error}
          </p>
        )}
        <div className="mx-auto flex max-w-[1440px]">
          <aside className="hidden min-h-[calc(100svh-70px)] w-56 shrink-0 border-r bg-background p-4 lg:block">
            <p className="mb-4 px-3 text-xs text-foreground/65">Ruang kerja</p>
            {navigation()}
          </aside>
          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AdminContext>
  )
}
