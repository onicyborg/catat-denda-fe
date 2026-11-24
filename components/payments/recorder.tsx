"use client"
import Link from "next/link"
import { useState } from "react"
import { Picker } from "@/components/fines/picker"
import { LedgerAction } from "./action"
import {
  LoadState,
  Pager,
  Feedback,
  useResource,
} from "@/components/master/shared"
import { Button } from "@/components/ui/button"
import { money, type Fine } from "@/lib/fines"
import type { Employee, Page } from "@/lib/master"

export function PaymentRecorder() {
  const [employee, setEmployee] = useState<Employee | null>(null)
  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-xl border bg-background p-5">
        <h2 className="font-semibold">1. Pilih karyawan</h2>
        <p className="text-sm text-foreground/70">
          Pilih nama untuk melihat denda dan mencatat pembayarannya.
        </p>
        <Picker
          kind="employees"
          all
          label={
            employee ? `Karyawan: ${employee.displayName}` : "Pilih karyawan"
          }
          onPick={(value) => setEmployee(value as Employee)}
        />
      </div>
      {employee ? (
        <EmployeeDues key={employee.id} employee={employee} />
      ) : (
        <p className="rounded-xl border border-dashed p-6 text-sm text-foreground/70">
          Daftar denda akan muncul setelah karyawan dipilih.
        </p>
      )}
    </div>
  )
}
function EmployeeDues({ employee }: { employee: Employee }) {
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState("")
  const result = useResource<Page<Fine>>(
    `/fine-cases?status=POSTED&employeeId=${employee.id}&limit=6&page=${page}`,
    true
  )
  return (
    <section className="space-y-4">
      <h2 className="font-semibold">2. Pilih denda yang dibayar</h2>
      <Feedback message={message} />
      <LoadState
        loading={result.loading}
        error={result.error}
        retry={result.reload}
        empty={
          result.data?.data.length === 0
            ? "Belum ada denda aktif untuk karyawan ini."
            : undefined
        }
      >
        <div className="space-y-3">
          {result.data?.data.map((fine) => {
            const member = fine.members.find(
              (value) => value.employeeId === employee.id
            )
            if (!member) return null
            const owing = BigInt(member.outstandingAmount) > BigInt(0)
            return (
              <article
                key={fine.id}
                className="space-y-4 rounded-xl border bg-background p-5"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/fines/${fine.id}`}
                      className="text-sm underline underline-offset-4"
                    >
                      {fine.displayCode}
                    </Link>
                    <h3 className="mt-2 font-medium break-words">
                      {fine.violationNameSnapshot ??
                        fine.violationType?.name ??
                        fine.description}
                    </h3>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/70">Sisa denda</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">
                      {money(member.outstandingAmount)}
                    </p>
                  </div>
                </div>
                {owing ? (
                  <LedgerAction
                    mode="payment"
                    target={member.id}
                    name={employee.displayName}
                    amount={member.outstandingAmount}
                    onRefresh={result.reload}
                    onDone={() => {
                      setMessage(
                        "Pembayaran berhasil dicatat. Sisa denda sudah diperbarui."
                      )
                      result.reload()
                    }}
                  />
                ) : (
                  <Button variant="secondary" disabled>
                    Lunas
                  </Button>
                )}
              </article>
            )
          })}
        </div>
      </LoadState>
      <Pager result={result.data} page={page} onChange={setPage} />
    </section>
  )
}
