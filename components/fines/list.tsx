"use client"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LoadState,
  Pager,
  useResource,
  fieldClass,
  selectClass,
} from "@/components/master/shared"
import { Picker } from "./picker"
import {
  caseLabels,
  settlementLabels,
  money,
  wib,
  type Fine,
} from "@/lib/fines"
import type { Page, Employee, Violation } from "@/lib/master"
export function FineList() {
  const [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [employee, setEmployee] = useState<Employee | null>(null),
    [type, setType] = useState<Violation | null>(null),
    [page, setPage] = useState(1),
    [query, setQuery] = useState("")
  const result = useResource<Page<Fine>>(
    `/fine-cases?page=${page}${query}`,
    true
  )
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-foreground/65">
            Register operasional
          </p>
          <h1 className="text-3xl font-semibold">Kejadian denda</h1>
          <p className="mt-3 text-sm text-foreground/65">
            Draft, alokasi, dan histori kejadian dalam satu pencatatan.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2"
          href="/fines/new"
        >
          Catat kejadian
        </Link>
      </div>
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 text-sm">
            <span>Cari kode, deskripsi, atau peserta</span>
            <Input
              className={fieldClass}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={120}
            />
          </label>
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
              employee ? "Karyawan: " + employee.displayName : "Filter karyawan"
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
          <Button type="submit" className="min-h-11">
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
      </form>
      <LoadState
        loading={result.loading}
        error={result.error}
        retry={result.reload}
        empty={
          result.data?.data.length === 0
            ? "Belum ada kejadian yang sesuai. Catat kejadian baru atau ubah filter."
            : undefined
        }
      >
        <div className="divide-y rounded-xl border bg-background">
          {result.data?.data.map((c) => (
            <article
              key={c.id}
              className="grid gap-4 p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={"/fines/" + c.id}
                    className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2"
                  >
                    {c.displayCode}
                  </Link>
                  <span className="text-xs">{caseLabels[c.status]}</span>
                  {c.settlementStatus && (
                    <span className="text-xs text-foreground/65">
                      {
                        settlementLabels[
                          c.settlementStatus as keyof typeof settlementLabels
                        ]
                      }
                    </span>
                  )}
                </div>
                <p className="font-medium break-words">
                  {c.violationNameSnapshot ??
                    c.violationType?.name ??
                    "Jenis belum dipilih"}
                </p>
                <p className="text-xs text-foreground/65">
                  {wib(c.occurredAt)}
                </p>
                <p className="text-sm break-words">
                  {c.description || "Deskripsi belum diisi"}
                </p>
                <p className="text-xs break-words text-foreground/65">
                  {c.members.length
                    ? c.members.map((m) => m.employeeDisplayName).join(", ")
                    : "Belum ada peserta"}
                </p>
              </div>
              <div className="space-y-2 md:text-right">
                <p className="text-xs text-foreground/65">
                  {c.status === "DRAFT"
                    ? "Preview alokasi"
                    : c.status === "VOIDED"
                      ? "Saldo aktif"
                      : "Total denda"}
                </p>
                <p className="text-xl font-semibold">
                  {money(
                    c.status === "DRAFT" ? c.previewAmount : c.assessedAmount
                  )}
                </p>
                {c.status === "POSTED" && (
                  <p className="text-sm text-foreground/65">
                    Sisa {money(c.outstandingAmount)}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </LoadState>
      <Pager result={result.data} page={page} onChange={setPage} />
    </section>
  )
}
