"use client"
import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Picker } from "@/components/fines/picker"
import { fieldClass, selectClass } from "@/components/master/shared"
import { api } from "@/lib/api"
import type { Employee, Violation } from "@/lib/master"
import { currentMonth, reportParams } from "@/lib/reporting"
export function useReportUrl() {
  const search = useSearchParams(),
    router = useRouter(),
    path = usePathname(),
    defaults = currentMonth()
  const values = {
    from: search.get("from") ?? defaults.from,
    to: search.get("to") ?? defaults.to,
    employeeId: search.get("employeeId") ?? "",
    violationTypeId: search.get("violationTypeId") ?? "",
    status: search.get("status") ?? "POSTED",
    includeUndated: search.get("includeUndated") ?? "false",
    kind: search.get("kind") ?? "",
    casePage: search.get("casePage") ?? "1",
    balancePage: search.get("balancePage") ?? "1",
  }
  const update = (next: Record<string, string>) => {
    const params = new URLSearchParams(search.toString())
    for (const [k, v] of Object.entries(next))
      if (v) params.set(k, v)
      else params.delete(k)
    router.replace(path + "?" + params.toString(), { scroll: false })
  }
  return {
    values,
    update,
    key: search.toString(),
    base: reportParams({
      from: values.from,
      to: values.to,
      employeeId: values.employeeId,
      violationTypeId: values.violationTypeId,
    }),
  }
}
export function ReportFilters({
  values,
  onApply,
  cases = false,
  fixedEmployee = false,
}: {
  values: {
    from: string
    to: string
    employeeId: string
    violationTypeId: string
    status: string
    includeUndated: string
  }
  onApply: (v: Record<string, string>) => void
  cases?: boolean
  fixedEmployee?: boolean
}) {
  const [from, setFrom] = useState(values.from),
    [to, setTo] = useState(values.to),
    [employee, setEmployee] = useState(values.employeeId),
    [type, setType] = useState(values.violationTypeId),
    [status, setStatus] = useState(values.status),
    [undated, setUndated] = useState(values.includeUndated === "true"),
    [employeeName, setEmployeeName] = useState("Karyawan tersimpan"),
    [typeName, setTypeName] = useState("Jenis tersimpan")
  useEffect(() => {
    const controller = new AbortController()
    if (values.employeeId)
      void api<Employee>("/employees/" + values.employeeId, {
        signal: controller.signal,
      })
        .then((e) => setEmployeeName(e.displayName))
        .catch(() => {})
    if (values.violationTypeId)
      void api<Violation>("/violation-types/" + values.violationTypeId, {
        signal: controller.signal,
      })
        .then((t) => setTypeName(t.name))
        .catch(() => {})
    return () => controller.abort()
  }, [values.employeeId, values.violationTypeId])
  return (
    <form
      className="space-y-4 rounded-xl border bg-background p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault()
        onApply({
          from,
          to,
          employeeId: employee,
          violationTypeId: type,
          ...(cases ? { status, includeUndated: String(undated) } : {}),
          casePage: "1",
          balancePage: "1",
        })
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-2 text-sm">
          <span>Dari tanggal (WIB)</span>
          <Input
            className={fieldClass + " w-full min-w-0"}
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
          />
        </label>
        <label className="space-y-2 text-sm">
          <span>Sampai tanggal (WIB)</span>
          <Input
            className={fieldClass + " w-full min-w-0"}
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
          />
        </label>
        {cases && (
          <div className="space-y-2 text-sm">
            <label htmlFor="report-status">
              Status daftar dan CSV kejadian
            </label>
            <select
              className={selectClass}
              id="report-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="POSTED">Diposting</option>
              <option value="DRAFT">Draft</option>
              <option value="VOIDED">Dibatalkan</option>
              <option value="ALL">Semua status</option>
            </select>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {!fixedEmployee && (
          <>
            <Picker
              kind="employees"
              label={employee ? employeeName : "Filter karyawan"}
              all
              onPick={(e) => {
                setEmployee(e.id)
                setEmployeeName((e as Employee).displayName)
              }}
            />
            {employee && (
              <Button
                className="min-h-11"
                type="button"
                variant="ghost"
                onClick={() => setEmployee("")}
              >
                Semua karyawan
              </Button>
            )}
          </>
        )}
        <Picker
          kind="violation-types"
          label={type ? typeName : "Filter jenis kesalahan"}
          all
          onPick={(t) => {
            setType(t.id)
            setTypeName((t as Violation).name)
          }}
        />
        {type && (
          <Button
            className="min-h-11"
            type="button"
            variant="ghost"
            onClick={() => setType("")}
          >
            Semua jenis
          </Button>
        )}
        <Button className="min-h-11" type="submit">
          Terapkan periode
        </Button>
        <Button
          className="min-h-11"
          type="button"
          variant="ghost"
          onClick={() =>
            onApply({
              ...currentMonth(),
              employeeId: fixedEmployee ? employee : "",
              violationTypeId: "",
              status: "POSTED",
              includeUndated: "false",
              casePage: "1",
              balancePage: "1",
              kind: "",
            })
          }
        >
          Bulan berjalan
        </Button>
      </div>
      {cases && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input
            className="size-5 accent-primary"
            type="checkbox"
            checked={undated}
            onChange={(e) => setUndated(e.target.checked)}
          />
          Sertakan kejadian tanpa tanggal pada daftar dan CSV
        </label>
      )}
    </form>
  )
}
