"use client"
import { Disclosure } from "@/components/workspace/disclosure"
import Link from "next/link"
import { PageHeader } from "@/components/workspace/page-header"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LoadState,
  Pager,
  fieldClass,
  selectClass,
  useResource,
} from "@/components/master/shared"
import { Picker } from "@/components/fines/picker"
import type { Employee, Page } from "@/lib/master"
import { money, wib } from "@/lib/fines"
import { methods, entryKinds, type Payment } from "@/lib/payments"
export function PaymentList() {
  const [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [kind, setKind] = useState(""),
    [employee, setEmployee] = useState<Employee | null>(null),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1)
  const result = useResource<Page<Payment>>(
    `/payments?page=${page}${query}`,
    true
  )
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Buku pembayaran"
        title="Riwayat pembayaran"
        description="Lihat pembayaran yang sudah dicatat."
        actions={
          <Link
            href="/payments/new"
            className="inline-flex min-h-12 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Catat pembayaran
          </Link>
        }
      />
      <Disclosure title="Filter pembayaran">
        {" "}
        <form
          className="space-y-4 rounded-xl border bg-background p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault()
            const params = new URLSearchParams()
            for (const [key, value] of Object.entries({
              from,
              to,
              kind,
              employeeId: employee?.id,
            }))
              if (value) params.set(key, value)
            setPage(1)
            setQuery("&" + params.toString())
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span>Dari tanggal efektif (WIB)</span>
              <Input
                className={fieldClass + " w-full min-w-0"}
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>Sampai tanggal efektif (WIB)</span>
              <Input
                className={fieldClass + " w-full min-w-0"}
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            <div className="space-y-2 text-sm">
              <label htmlFor="ledger-kind">Jenis transaksi</label>
              <select
                id="ledger-kind"
                className={selectClass}
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="">Semua transaksi</option>
                {Object.entries(entryKinds).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
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
              onPick={(e) => setEmployee(e as Employee)}
            />
            <Button className="min-h-11" type="submit">
              Terapkan filter
            </Button>
            <Button
              type="button"
              className="min-h-11"
              variant="ghost"
              onClick={() => {
                setFrom("")
                setTo("")
                setKind("")
                setEmployee(null)
                setQuery("")
                setPage(1)
              }}
            >
              Reset filter
            </Button>
          </div>
        </form>
      </Disclosure>
      <LoadState
        loading={result.loading}
        error={result.error}
        retry={result.reload}
        empty={
          result.data?.data.length === 0
            ? "Belum ada transaksi yang sesuai. Catat pembayaran dari detail kejadian atau ubah filter."
            : undefined
        }
      >
        <div className="divide-y rounded-xl border bg-background">
          {result.data?.data.map((e) => (
            <article key={e.id}>
              <Link
                href={"/payments/" + e.id}
                aria-label={entryKinds[e.kind] + " · " + e.caseCode}
                className="grid gap-3 p-4 hover:bg-muted/40 focus-visible:outline-2 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0 space-y-2">
                  <span className="inline-flex min-h-8 items-center text-sm font-semibold">
                    {entryKinds[e.kind]} · {e.caseCode}
                  </span>
                  <p className="text-sm font-medium break-words">
                    {e.employeeName}
                  </p>
                  <p className="text-xs text-foreground/65">
                    Efektif {wib(e.effectiveAt)}
                  </p>
                  <p className="text-xs break-words text-foreground/65">
                    Dicatat {wib(e.createdAt)} · {e.recordedByName}
                  </p>
                  {e.note && <p className="text-sm break-words">{e.note}</p>}
                </div>
                <div className="space-y-2 md:text-right">
                  <p className="text-xl font-semibold">
                    {e.kind === "REVERSAL" ? "− " : ""}
                    {money(e.amount)}
                  </p>
                  <p className="text-xs text-foreground/65">
                    {e.method ? methods[e.method] : "Pembalikan penuh"}
                    {e.reversalId ? " · Sudah dibalik" : ""}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </LoadState>
      <Pager result={result.data} page={page} onChange={setPage} />
    </section>
  )
}
