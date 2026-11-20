"use client"
import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { api, apiEnvelope, ApiError } from "@/lib/api"
import { useAdmin } from "@/components/admin-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Page } from "@/lib/master"
export const fieldClass =
  "h-11 rounded-lg border-muted-foreground bg-background text-base placeholder:text-foreground/60 sm:text-sm"
export const selectClass =
  "h-11 w-full rounded-lg border border-muted-foreground bg-background px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:text-sm"
export function useResource<T>(path: string, envelope = false) {
  const [revision, setRevision] = useState(0)
  const key = `${path}:${revision}`
  const [state, setState] = useState<{
    key: string
    data?: T
    error?: string
    status?: number
  }>({ key: "" })
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const load = envelope ? apiEnvelope<T> : api<T>
    void load(path, { signal: controller.signal })
      .then((data) => {
        if (active) setState({ key, data })
      })
      .catch((error) => {
        if (active)
          setState({
            key,
            error: error.message,
            status: error instanceof ApiError ? error.status : undefined,
          })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [path, key, envelope])
  return {
    data: state.key === key ? state.data : undefined,
    error: state.key === key ? state.error : undefined,
    status: state.key === key ? state.status : undefined,
    loading: state.key !== key,
    reload: () => setRevision((value) => value + 1),
  }
}
export function FieldError({
  id,
  children,
}: {
  id: string
  children?: ReactNode
}) {
  return children ? (
    <p id={id} role="alert" className="text-sm text-destructive">
      {children}
    </p>
  ) : null
}
export function Feedback({
  error,
  message,
}: {
  error?: string
  message?: string
}) {
  return error ? (
    <p
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
    >
      {error}
    </p>
  ) : message ? (
    <p role="status" className="rounded-lg border bg-muted/40 p-3 text-sm">
      {message}
    </p>
  ) : null
}
export function LoadState({
  loading,
  error,
  retry,
  empty,
  children,
  loadingView,
}: {
  loading: boolean
  error?: string
  retry: () => void
  empty?: string
  children: ReactNode
  loadingView?: ReactNode
}) {
  if (loading && loadingView) return loadingView
  if (loading)
    return (
      <p
        role="status"
        className="rounded-xl border bg-background p-8 text-sm text-foreground/65"
      >
        Memuat data…
      </p>
    )
  if (error)
    return (
      <div className="space-y-3 rounded-xl border bg-background p-6">
        <Feedback error={error} />
        <Button variant="outline" onClick={retry}>
          Coba lagi
        </Button>
      </div>
    )
  if (empty)
    return (
      <div className="rounded-xl border border-dashed bg-background p-8 text-sm text-foreground/65">
        {empty}
      </div>
    )
  return children
}
export function Pager<T>({
  result,
  page,
  onChange,
}: {
  result?: Page<T>
  page: number
  onChange: (page: number) => void
}) {
  if (!result) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-foreground/65">
        {result.meta.total} data · Halaman {page} dari{" "}
        {Math.max(1, result.meta.totalPages)}
      </p>
      <div className="flex gap-2">
        <Button
          className="h-11"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Sebelumnya
        </Button>
        <Button
          className="h-11"
          variant="outline"
          disabled={page >= result.meta.totalPages}
          onClick={() => onChange(page + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  )
}
export function ConfirmAction({
  label,
  title,
  description,
  path,
  method = "POST",
  onDone,
  variant = "outline",
}: {
  label: string
  title: string
  description: string
  path: string
  method?: string
  onDone: () => void
  variant?: "outline" | "ghost"
}) {
  const admin = useAdmin()
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) {
          setOpen(value)
          if (value) setError("")
        }
      }}
    >
      <DialogTrigger render={<Button variant={variant} className="min-h-11" />}>
        {label}
      </DialogTrigger>
      <DialogContent
        showCloseButton={!busy}
        className="max-h-[85dvh] overflow-y-auto rounded-2xl"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Feedback error={error} />
        <DialogFooter>
          <Button
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            Batal
          </Button>
          <Button
            className="min-h-11"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setError("")
              try {
                await api(path, {
                  method,
                  headers: { "X-CSRF-Token": admin.csrfToken },
                  body: method === "DELETE" ? undefined : "{}",
                })
                setOpen(false)
                onDone()
              } catch (err) {
                setError((err as Error).message)
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? "Menyimpan…" : "Konfirmasi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
export function Status({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs ${active ? "text-foreground" : "text-foreground/65"}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${active ? "bg-primary" : "bg-foreground/40"}`}
      />
      {active ? "Aktif" : "Diarsipkan"}
    </span>
  )
}
