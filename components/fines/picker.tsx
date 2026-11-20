"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  LoadState,
  Pager,
  useResource,
  fieldClass,
} from "@/components/master/shared"
import type { Employee, Violation, Page } from "@/lib/master"
import { money } from "@/lib/fines"
export function Picker({
  kind,
  label,
  onPick,
  selected = [],
  all = false,
  disabled = false,
}: {
  kind: "employees" | "violation-types"
  label: string
  onPick: (item: Employee | Violation) => void
  selected?: string[]
  all?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="min-h-11 max-w-full break-words whitespace-normal"
            disabled={disabled}
          />
        }
      >
        {label}
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {kind === "employees" ? "Pilih karyawan" : "Pilih jenis kesalahan"}
          </DialogTitle>
          <DialogDescription>
            {kind === "employees"
              ? "Cari nama, kode atau alias. Nama sama dibedakan dengan kode atau ID."
              : "Tarif berlaku per peserta. Nominal individual dapat dikoreksi."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <PickerContent
            kind={kind}
            selected={selected}
            all={all}
            onPick={(item) => {
              onPick(item)
              if (kind !== "employees" || all) setOpen(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
function PickerContent({
  kind,
  onPick,
  selected,
  all,
}: {
  kind: "employees" | "violation-types"
  onPick: (item: Employee | Violation) => void
  selected: string[]
  all: boolean
}) {
  const [q, setQ] = useState(""),
    [page, setPage] = useState(1)
  const result = useResource<Page<Employee | Violation>>(
    `/${kind}?status=${all ? "ALL" : "ACTIVE"}&limit=10&page=${page}&q=${encodeURIComponent(q)}`,
    true
  )
  return (
    <div className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm">Cari pilihan</span>
        <Input
          className={fieldClass}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          autoFocus
        />
      </label>
      <LoadState
        loading={result.loading}
        error={result.error}
        retry={result.reload}
        empty={
          result.data?.data.length === 0
            ? "Tidak ada pilihan. Tambahkan master aktif jika diperlukan."
            : undefined
        }
      >
        <div className="divide-y">
          {result.data?.data.map((item) => (
            <Button
              type="button"
              key={item.id}
              variant="ghost"
              className="h-auto min-h-14 w-full justify-between gap-3 rounded-none py-3 text-left whitespace-normal"
              disabled={
                selected.includes(item.id) ||
                (kind === "employees" && selected.length >= 20)
              }
              onClick={() => onPick(item)}
            >
              <span className="min-w-0 break-words">
                {"displayName" in item ? item.displayName : item.name}
                <span className="mt-1 block text-xs text-foreground/65">
                  {"employeeCode" in item
                    ? item.employeeCode || `ID ${item.id.slice(0, 8)}`
                    : (item as Violation).code}
                  {!item.isActive ? " · Diarsipkan" : ""}
                </span>
              </span>
              {"defaultAmountPerPerson" in item && (
                <span className="shrink-0 text-xs">
                  {money(item.defaultAmountPerPerson)}
                </span>
              )}
              {selected.includes(item.id) && (
                <span className="text-xs">Dipilih</span>
              )}
            </Button>
          ))}
        </div>
      </LoadState>
      <Pager result={result.data} page={page} onChange={setPage} />
    </div>
  )
}
