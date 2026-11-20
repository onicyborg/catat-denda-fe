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
  RiMenuLine,
  RiSunLine,
  RiMoonLine,
  RiLogoutBoxRLine,
  RiArrowRightSLine,
} from "@remixicon/react"
import {
  BusinessBrand,
  useBusinessName,
} from "@/components/reporting/business-settings"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { Admin } from "@/lib/api"

const groups = [
  {
    label: "Operasional",
    links: [
      { href: "/dashboard", label: "Ringkasan", icon: RiDashboardLine },
      { href: "/fines", label: "Kejadian denda", icon: RiFileList3Line },
      { href: "/payments", label: "Pembayaran", icon: RiWallet3Line },
    ],
  },
  {
    label: "Data master",
    links: [
      { href: "/employees", label: "Karyawan", icon: RiGroupLine },
      {
        href: "/mistake-types",
        label: "Jenis kesalahan",
        icon: RiPriceTag3Line,
      },
    ],
  },
  {
    label: "Administrasi",
    links: [
      { href: "/reports", label: "Laporan", icon: RiBarChartBoxLine },
      { href: "/audit-logs", label: "Audit log", icon: RiHistoryLine },
      { href: "/settings", label: "Akun", icon: RiSettings3Line },
    ],
  },
]

function Navigation({
  pathname,
  close,
}: {
  pathname: string
  close?: () => void
}) {
  return (
    <nav aria-label="Menu utama" className="space-y-7">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-xs font-medium text-foreground/65">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.links.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(href + "/")
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none ${active ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary" : "text-foreground/70 hover:bg-sidebar-accent hover:text-foreground"}`}
                >
                  <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

function Brand({ name }: { name: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-foreground">
        <RiFileList3Line className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <BusinessBrand name={name} />
        <p className="-mt-1 text-xs text-foreground/65">
          Pencatatan denda karyawan
        </p>
      </div>
    </div>
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
  const businessName = useBusinessName()
  const { resolvedTheme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const current = groups
    .flatMap((group) => group.links)
    .find(
      (link) => pathname === link.href || pathname.startsWith(link.href + "/")
    )
  return (
    <div className="workspace min-h-svh bg-muted/35">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-lg bg-foreground px-4 py-3 text-background focus:translate-y-0"
      >
        Langsung ke konten
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar lg:flex">
        <div className="border-b px-5 py-5">
          <Brand name={businessName} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
          <Navigation pathname={pathname} />
        </div>
        <div className="mx-4 mb-5 border-t px-3 pt-4">
          <p className="text-xs font-medium">Catat Denda</p>
          <p className="mt-1 text-xs leading-5 text-foreground/65">
            Catatan tertib, tanggung jawab jelas.
          </p>
        </div>
      </aside>
      <div className="min-w-0 lg:pl-60">
        <header className="sticky top-0 z-20 flex min-h-18 items-center justify-between gap-3 border-b bg-background px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="outline"
                    className="size-11 shrink-0 lg:hidden"
                    aria-label="Menu"
                  />
                }
              >
                <RiMenuLine className="size-5" aria-hidden="true" />
              </DialogTrigger>
              <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Menu</DialogTitle>
                  <DialogDescription>Ruang kerja Catat Denda</DialogDescription>
                </DialogHeader>
                <Navigation
                  pathname={pathname}
                  close={() => setMenuOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <div className="min-w-0 flex-1 lg:hidden">
              <BusinessBrand name={businessName} />
            </div>
            <nav
              aria-label="Lokasi halaman"
              className="hidden items-center gap-2 text-sm lg:flex"
            >
              <span className="text-foreground/65">Ruang kerja</span>
              <RiArrowRightSLine
                className="size-4 text-foreground/65"
                aria-hidden="true"
              />
              <span
                className="font-medium"
                aria-current={pathname === current?.href ? "page" : undefined}
              >
                {current?.label ?? "Ringkasan"}
              </span>
              {current && pathname !== current.href && (
                <>
                  <RiArrowRightSLine
                    className="size-4 text-foreground/65"
                    aria-hidden="true"
                  />
                  <span aria-current="page">
                    {pathname.endsWith("/new") ? "Catat kejadian" : "Detail"}
                  </span>
                </>
              )}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="mr-1 hidden max-w-40 text-right sm:block">
              <p className="truncate text-sm font-semibold">
                {admin.username ?? "Admin"}
              </p>
              <p className="text-xs text-foreground/65">Administrator</p>
            </div>
            <Button
              variant="ghost"
              className="size-11"
              aria-label="Ganti tema"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <RiMoonLine
                className="size-[18px] dark:hidden"
                aria-hidden="true"
              />
              <RiSunLine
                className="hidden size-[18px] dark:block"
                aria-hidden="true"
              />
            </Button>
            <Button
              variant="outline"
              className="min-h-11 gap-2"
              disabled={loggingOut}
              onClick={onLogout}
            >
              <RiLogoutBoxRLine
                className="hidden size-4 sm:block"
                aria-hidden="true"
              />
              {loggingOut ? "Keluar…" : "Keluar"}
            </Button>
          </div>
        </header>
        {error && (
          <p
            role="alert"
            className="mx-4 mt-4 rounded-lg border border-destructive/40 bg-background p-4 text-sm text-destructive sm:mx-6"
          >
            {error}
          </p>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className="workspace-main mx-auto w-full max-w-[1600px] min-w-0 scroll-mt-24 px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8"
        >
          {children}
        </main>
        <footer className="mx-4 flex flex-wrap justify-between gap-2 border-t py-5 text-xs text-foreground/65 sm:mx-6 lg:mx-8">
          <span>Catat Denda · Ruang kerja pengelola</span>
          <span>IDR · Asia/Jakarta</span>
        </footer>
      </div>
    </div>
  )
}
