"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import { useTheme } from "next-themes"
import {
  RiDashboardLine,
  RiFileList3Line,
  RiWallet3Line,
  RiGroupLine,
  RiPriceTag3Line,
  RiBarChartBoxLine,
  RiHistoryLine,
  RiSettings3Line,
  RiMoreLine,
  RiAddLine,
  RiSunLine,
  RiMoonLine,
  RiLogoutBoxRLine,
  RiArrowLeftLine,
} from "@remixicon/react"
import {
  BusinessBrand,
  useBusinessName,
} from "@/components/reporting/business-settings"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { PageTransition } from "./motion"
import type { Admin } from "@/lib/api"

const links = [
  { href: "/dashboard", label: "Ringkasan", icon: RiDashboardLine },
  { href: "/fines", label: "Denda", icon: RiFileList3Line },
  { href: "/employees", label: "Karyawan", icon: RiGroupLine },
  { href: "/payments", label: "Pembayaran", icon: RiWallet3Line },
  { href: "/mistake-types", label: "Jenis kesalahan", icon: RiPriceTag3Line },
  { href: "/reports", label: "Laporan", icon: RiBarChartBoxLine },
  { href: "/audit-logs", label: "Riwayat aktivitas", icon: RiHistoryLine },
  { href: "/settings", label: "Pengaturan", icon: RiSettings3Line },
]
const activeAt = (path: string, href: string) =>
  path === href || path.startsWith(href + "/")
function Navigation({
  pathname,
  close,
  secondary = false,
}: {
  pathname: string
  close?: () => void
  secondary?: boolean
}) {
  return (
    <nav aria-label="Menu utama" className="space-y-1">
      {(secondary ? links.slice(3) : links).map(
        ({ href, label, icon: Icon }, index) => (
          <Link
            key={href}
            href={href}
            onClick={close}
            aria-current={activeAt(pathname, href) ? "page" : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-lg px-3 py-3 text-sm focus-visible:outline-2 ${index === 4 ? "mt-6" : ""} ${activeAt(pathname, href) ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "text-foreground/75 hover:bg-muted"}`}
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            {label}
          </Link>
        )
      )}
    </nav>
  )
}
export function WorkspaceShell({
  admin,
  loggingOut,
  onLogout,
  error,
  children,
}: {
  admin: Admin
  loggingOut: boolean
  onLogout: () => void
  error: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const name = useBusinessName()
  const { resolvedTheme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const current = links.find((link) => activeAt(pathname, link.href))
  const detail = Boolean(current && pathname !== current.href)
  return (
    <div className="workspace min-h-dvh bg-muted/25">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-lg bg-foreground px-4 py-3 text-background focus:translate-y-0"
      >
        Langsung ke konten
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r bg-background p-4 lg:flex">
        <div className="mb-7 flex min-h-14 items-center gap-3 px-2">
          <RiFileList3Line aria-hidden="true" className="size-6 shrink-0" />
          <div className="min-w-0">
            <BusinessBrand name={name} />
            <span className="text-xs text-foreground/70">
              Catatan denda usaha
            </span>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Navigation pathname={pathname} />
        </div>
        <p className="border-t px-3 pt-4 text-xs text-foreground/70">
          Masuk sebagai{" "}
          <span className="font-medium break-words">
            {admin.username ?? "Admin"}
          </span>
        </p>
      </aside>
      <div className="min-w-0 lg:pl-56">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            {detail && current ? (
              <Link
                aria-label={`Kembali ke ${current.label}`}
                href={current.href}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-muted"
              >
                <RiArrowLeftLine aria-hidden="true" className="size-5" />
              </Link>
            ) : null}
            <div className="min-w-0">
              <Link
                href={detail && current ? current.href : "/dashboard"}
                className="block max-w-[55vw] truncate text-sm font-semibold lg:hidden"
              >
                {detail
                  ? pathname.endsWith("/new")
                    ? current?.href === "/payments"
                      ? "Catat pembayaran"
                      : "Catat denda"
                    : "Detail"
                  : name}
              </Link>
              <p className="hidden text-sm font-medium lg:block">
                {current?.label ?? "Catat Denda"}
                {detail ? " / Detail" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              className="size-11"
              aria-label="Ganti tema"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <RiMoonLine aria-hidden="true" className="size-5 dark:hidden" />
              <RiSunLine
                aria-hidden="true"
                className="hidden size-5 dark:block"
              />
            </Button>
            <Button
              variant="ghost"
              className="hidden min-h-11 gap-2 lg:inline-flex"
              disabled={loggingOut}
              onClick={onLogout}
            >
              <RiLogoutBoxRLine aria-hidden="true" className="size-4" />
              {loggingOut ? "Keluar…" : "Keluar"}
            </Button>
            <Button
              variant="ghost"
              className="size-11 lg:hidden"
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
            >
              <RiMoreLine aria-hidden="true" className="size-5" />
            </Button>
          </div>
        </header>
        {error && (
          <p
            role="alert"
            className="m-4 rounded-lg border border-destructive/40 bg-background p-4 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className="workspace-main mx-auto w-full max-w-7xl min-w-0 scroll-mt-20 px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>
      </div>
      <nav
        aria-label="Navigasi mobile"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background px-1 pt-1 pb-[max(.5rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        {[
          links[0],
          links[1],
          { href: "/fines/new", label: "Catat", icon: RiAddLine },
          links[2],
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={
              (
                href === "/fines/new"
                  ? pathname === href
                  : activeAt(pathname, href) && pathname !== "/fines/new"
              )
                ? "page"
                : undefined
            }
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium focus-visible:outline-2 ${href === "/fines/new" ? "text-foreground" : activeAt(pathname, href) && pathname !== "/fines/new" ? "bg-muted font-semibold" : "text-foreground/70"}`}
          >
            <span
              className={
                href === "/fines/new"
                  ? "rounded-lg bg-primary px-3 py-1 text-primary-foreground"
                  : ""
              }
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
            {label}
          </Link>
        ))}
        <button
          type="button"
          aria-label="Lainnya"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium text-foreground/75 focus-visible:outline-2"
        >
          <RiMoreLine aria-hidden="true" className="size-5" />
          Lainnya
        </button>
      </nav>
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Menu</DialogTitle>
            <DialogDescription>Data usaha dan pengaturan</DialogDescription>
          </DialogHeader>
          <Navigation
            pathname={pathname}
            secondary
            close={() => setMenuOpen(false)}
          />
          <div className="border-t pt-3">
            <p className="mb-2 text-sm text-foreground/70">
              {admin.username ?? "Admin"}
            </p>
            <Button
              variant="outline"
              className="min-h-11 w-full"
              disabled={loggingOut}
              onClick={onLogout}
            >
              {loggingOut ? "Keluar…" : "Keluar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
