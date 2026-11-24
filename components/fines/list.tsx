"use client"
import Link from "next/link"
import { PageHeader } from "@/components/workspace/page-header"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LoadState,
  useResource,
  fieldClass,
  selectClass,
} from "@/components/master/shared"
import { Picker } from "./picker"
import { caseLabels, type Fine } from "@/lib/fines"
import { Disclosure } from "@/components/workspace/disclosure"
import { FineCard } from "./card"
import { FinePagination } from "./pagination"
import type { Page, Employee, Violation } from "@/lib/master"
export function FineList() {
  const [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [employee, setEmployee] = useState<Employee | null>(null),
    [type, setType] = useState<Violation | null>(null),
    [page, setPage] = useState(1),
    [limit, setLimit] = useState(6),
    [query, setQuery] = useState("")
  const result = useResource<Page<Fine>>(
    `/fine-cases?page=${page}&limit=${limit}${query}`,
    true
  )
  const heading = useRef<HTMLHeadingElement>(null)
  const focusResults = useRef(false)
  useEffect(() => {
    if (!result.loading && focusResults.current) {
      focusResults.current = false
      heading.current?.focus({ preventScroll: true })
      heading.current?.scrollIntoView({ block: "start" })
    }
  }, [result.loading])
  const changePage = (next: number) => {
    if (next === page) return
    focusResults.current = true
    setPage(next)
  }
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Register operasional"
        title="Kejadian denda"
        description="Cari denda, lengkapi draft, atau lihat pembayaran."
        actions={
          <Link
            className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2"
            href="/fines/new"
          >
            Catat kejadian
          </Link>
        }
      />
      <form
        className="space-y-4 rounded-xl border bg-background p-4 sm:p-5"
        onSubmit={(e) => {
          e.preventDefault()
          const params = new URLSearchParams()
          for (const [key, value] of Object.entries({
            q,
            status,
            from,
            to,
            employeeId: employee?.id,
            violationTypeId: type?.id,
          }))
            if (value) params.set(key, value)
          setPage(1)
          setQuery("&" + params.toString())
        }}
      >
        <div className="flex items-end gap-2">
          <label className="min-w-0 flex-1 space-y-2 text-sm">
            <span>Cari kode, deskripsi, atau peserta</span>
            <Input
              className={fieldClass}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={120}
            />
          </label>
          <Button type="submit" variant="outline" className="min-h-11">
            Cari
          </Button>
        </div>
        <Disclosure
          title="Filter denda"
          summary={
            query.replace(/^&/, "")
              ? "Filter diterapkan · ketuk untuk mengubah"
              : "Status, tanggal, karyawan, dan jenis kesalahan"
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 text-sm">
              <label htmlFor="fine-status">Status kejadian</label>
              <select
                id="fine-status"
                className={selectClass}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Semua status</option>
                {Object.entries(caseLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <label className="space-y-2 text-sm">
              <span>Dari tanggal (WIB)</span>
              <Input
                type="date"
                className={fieldClass + " w-full min-w-0"}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>Sampai tanggal (WIB)</span>
              <Input
                type="date"
                className={fieldClass + " w-full min-w-0"}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <Picker
              kind="employees"
              label={
                employee
                  ? "Karyawan: " + employee.displayName
                  : "Filter karyawan"
              }
              all
              onPick={(v) => setEmployee(v as Employee)}
            />
            <Picker
              kind="violation-types"
              label={type ? "Jenis: " + type.name : "Filter jenis"}
              all
              onPick={(v) => setType(v as Violation)}
            />
            <Button type="submit" className="min-h-11 hover:bg-primary/90">
              Terapkan filter
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              onClick={() => {
                setQ("")
                setStatus("")
                setFrom("")
                setTo("")
                setEmployee(null)
                setType(null)
                setPage(1)
                setQuery("")
              }}
            >
              Reset filter
            </Button>
          </div>
        </Disclosure>
      </form>
      <section aria-labelledby="fine-results-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              ref={heading}
              id="fine-results-heading"
              tabIndex={-1}
              className="scroll-mt-24 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Daftar kejadian
            </h2>
            <p className="mt-1 text-sm text-foreground/75">
              Terbaru ke terlama · Berdasarkan waktu pencatatan
            </p>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <span className="whitespace-nowrap">Per halaman</span>
            <select
              className={selectClass.replace("w-full", "w-20")}
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
            >
              {[6, 12, 24].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p
          role="status"
          aria-atomic="true"
          className="text-sm text-foreground/75"
        >
          {result.loading
            ? "Memuat kejadian…"
            : result.data
              ? result.data.meta.total === 0
                ? "0 kejadian ditemukan"
                : `Menampilkan ${(page - 1) * limit + 1}–${Math.min(page * limit, result.data.meta.total)} dari ${result.data.meta.total} kejadian`
              : "Daftar belum dapat dimuat"}
        </p>
        <LoadState
          loading={result.loading}
          error={result.error}
          retry={result.reload}
          empty={
            result.data?.data.length === 0
              ? "Belum ada kejadian yang sesuai. Catat kejadian baru atau ubah filter."
              : undefined
          }
          loadingView={
            <div
              aria-hidden="true"
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {Array.from({ length: limit }, (_, index) => (
                <div
                  key={index}
                  className="h-80 rounded-xl border bg-muted/40"
                />
              ))}
            </div>
          }
        >
          <ul
            aria-label="Daftar kejadian denda"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {result.data?.data.map((fine) => (
              <FineCard key={fine.id} fine={fine} />
            ))}
          </ul>
        </LoadState>
        {result.data && result.data.meta.total > 0 && (
          <FinePagination
            meta={result.data.meta}
            page={page}
            onChange={changePage}
          />
        )}
      </section>
    </section>
  )
}
