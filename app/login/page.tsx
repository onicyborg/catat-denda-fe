"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  RiFileList3Line,
  RiEyeLine,
  RiEyeOffLine,
  RiMoonLine,
  RiSunLine,
} from "@remixicon/react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"

export default function Login() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [visible, setVisible] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouter()
  return (
    <main className="flex min-h-svh flex-col bg-muted/40 p-4 sm:p-8 lg:justify-center lg:p-12">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-5 flex items-center justify-between gap-4 lg:mb-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl border bg-background text-primary dark:text-foreground">
              <RiFileList3Line size={22} aria-hidden="true" />
            </span>
            <span className="font-semibold tracking-tight">
              Catat Denda
              <span className="mt-0.5 block text-xs font-normal tracking-normal text-foreground/65">
                Catatan operasional usaha
              </span>
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-11 rounded-full bg-background"
            aria-label="Ganti tema"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            <RiMoonLine size={18} aria-hidden="true" className="dark:hidden" />
            <RiSunLine
              size={18}
              aria-hidden="true"
              className="hidden dark:block"
            />
          </Button>
        </header>
        <div className="grid rounded-2xl border bg-background lg:min-h-[620px] lg:grid-cols-[1.08fr_1fr]">
          <section
            className="relative rounded-t-2xl border-b bg-muted/40 px-6 py-7 sm:px-10 lg:flex lg:flex-col lg:justify-between lg:rounded-l-2xl lg:rounded-tr-none lg:border-r lg:border-b-0 lg:p-12"
            aria-labelledby="intro-title"
          >
            <div>
              <p className="mb-4 hidden items-center gap-2 text-sm text-foreground/65 lg:flex">
                <span className="h-px w-6 bg-primary" />
                Pencatatan denda karyawan
              </p>
              <h2
                id="intro-title"
                className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl lg:text-[2.5rem]"
              >
                Dari kejadian,
                <br className="hidden lg:block" /> hingga penyelesaian.
              </h2>
              <p className="mt-4 hidden max-w-sm text-sm leading-relaxed text-foreground/65 sm:block">
                Ruang kerja untuk mencatat kejadian, merinci nominal per
                karyawan, dan menelusuri penyelesaiannya.
              </p>
            </div>
            <figure className="mt-10 hidden rounded-xl border bg-background lg:block">
              <figcaption className="flex items-center justify-between border-b px-5 py-4 text-xs">
                <span className="font-medium">Contoh alokasi</span>
                <span className="text-foreground/65">
                  1 kejadian · 2 karyawan
                </span>
              </figcaption>
              <div className="px-5">
                {["Karyawan A", "Karyawan B"].map((name, index) => (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-4 border-b py-4 text-sm"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-foreground/65">
                        0{index + 1}
                      </span>
                      {name}
                    </span>
                    <span className="font-medium tabular-nums">Rp5.000</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-5 text-sm">
                  <span className="text-foreground/65">Total kejadian</span>
                  <span className="text-xl font-semibold text-primary tabular-nums dark:text-foreground">
                    Rp10.000
                  </span>
                </div>
              </div>
            </figure>
            <p className="mt-8 hidden text-xs text-foreground/65 lg:block">
              Satu kejadian, rincian tanggung jawab per orang.
            </p>
          </section>
          <section
            className="flex flex-col justify-center px-6 py-7 sm:px-10 sm:py-9 lg:px-14 lg:py-12"
            aria-labelledby="login-title"
          >
            <div className="mb-8">
              <p className="mb-3 text-sm font-medium text-primary dark:text-foreground">
                Akses pengelola
              </p>
              <h1
                id="login-title"
                className="text-2xl font-semibold tracking-tight sm:text-3xl"
              >
                Masuk sebagai admin
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-foreground/65">
                Masukkan akun Anda untuk membuka ruang kerja.
              </p>
            </div>
            <form
              className="space-y-5"
              aria-busy={busy}
              onSubmit={async (e) => {
                e.preventDefault()
                if (busy) return
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
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={254}
                  required
                  placeholder="Masukkan username"
                  className="h-12 rounded-lg border-muted-foreground bg-muted/40 px-3.5 placeholder:text-foreground/65"
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Kata sandi
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={visible ? "text" : "password"}
                    autoComplete="current-password"
                    maxLength={256}
                    required
                    placeholder="Masukkan kata sandi"
                    className="h-12 rounded-lg border-muted-foreground bg-muted/40 pr-12 pl-3.5 placeholder:text-foreground/65"
                    aria-describedby={error ? "login-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0.5 right-0.5 size-11 rounded-md text-foreground/65"
                    aria-label={
                      visible
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                    aria-pressed={visible}
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? (
                      <RiEyeOffLine size={18} aria-hidden="true" />
                    ) : (
                      <RiEyeLine size={18} aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <p
                  id="login-error"
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm leading-relaxed text-destructive"
                >
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={busy}
                className="mt-1 h-12 w-full"
              >
                {busy ? "Sedang masuk…" : "Masuk"}
              </Button>
            </form>
            <p className="mt-7 border-t pt-5 text-xs leading-relaxed text-foreground/65">
              Akses khusus administrator. Hubungi pengelola usaha jika Anda
              mengalami kendala masuk.
            </p>
          </section>
        </div>
        <footer className="mt-5 flex flex-wrap justify-between gap-2 text-xs text-foreground/65 lg:mt-7">
          <span>Pencatatan Denda Karyawan</span>
          <span>Rupiah (IDR) · Waktu Indonesia Barat</span>
        </footer>
      </div>
    </main>
  )
}
