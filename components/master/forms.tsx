"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useAdmin } from "@/components/admin-context"
import { api } from "@/lib/api"
import { categories, type Employee, type Violation } from "@/lib/master"
import { Feedback, FieldError, fieldClass, selectClass } from "./shared"
const employeeSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(120, "Nama maksimal 120 karakter."),
  employeeCode: z.string().trim().max(40, "Kode maksimal 40 karakter."),
})
const violationSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{2,40}$/, "Kode 2–40 huruf, angka, tanda - atau _."),
  name: z
    .string()
    .trim()
    .min(3, "Nama minimal 3 karakter.")
    .max(120, "Nama maksimal 120 karakter."),
  category: z.enum([
    "PREPARATION",
    "SPILL",
    "CLEANLINESS",
    "INVENTORY_LOG",
    "ORDER",
    "OTHER",
  ]),
  defaultAmountPerPerson: z
    .number({ error: "Masukkan nominal Rupiah bulat." })
    .int("Gunakan nominal Rupiah bulat.")
    .min(1, "Nominal minimal Rp1.")
    .max(100000000, "Nominal maksimal Rp100.000.000."),
  description: z
    .string()
    .trim()
    .max(1000, "Deskripsi maksimal 1.000 karakter."),
})
export function EmployeeEditor({
  employee,
  onSaved,
}: {
  employee?: Employee
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={employee ? "outline" : "default"} className="h-11" />
        }
      >
        {employee ? "Ubah profil" : "Tambah karyawan"}
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Ubah profil karyawan" : "Tambah karyawan"}
          </DialogTitle>
          <DialogDescription>
            Nama sama diperbolehkan. Gunakan kode untuk membedakan karyawan.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <EmployeeForm
            employee={employee}
            onSaved={() => {
              setOpen(false)
              onSaved()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
function EmployeeForm({
  employee,
  onSaved,
}: {
  employee?: Employee
  onSaved: () => void
}) {
  const admin = useAdmin(),
    [error, setError] = useState("")
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      displayName: employee?.displayName ?? "",
      employeeCode: employee?.employeeCode ?? "",
    },
  })
  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setError("")
        try {
          await api(employee ? `/employees/${employee.id}` : "/employees", {
            method: employee ? "PATCH" : "POST",
            headers: { "X-CSRF-Token": admin.csrfToken },
            body: JSON.stringify({
              ...values,
              employeeCode: values.employeeCode || null,
            }),
          })
          onSaved()
        } catch (err) {
          setError((err as Error).message)
        }
      })}
    >
      <div className="space-y-2">
        <label htmlFor="employee-name" className="text-sm font-medium">
          Nama karyawan
        </label>
        <Input
          autoFocus
          id="employee-name"
          className={fieldClass}
          maxLength={120}
          {...register("displayName")}
          aria-invalid={!!errors.displayName}
          aria-describedby="employee-name-error"
        />
        <FieldError id="employee-name-error">
          {errors.displayName?.message}
        </FieldError>
      </div>
      <div className="space-y-2">
        <label htmlFor="employee-code" className="text-sm font-medium">
          Kode karyawan (opsional)
        </label>
        <Input
          id="employee-code"
          className={fieldClass}
          maxLength={40}
          {...register("employeeCode")}
          aria-invalid={!!errors.employeeCode}
          aria-describedby="employee-code-error"
        />
        <FieldError id="employee-code-error">
          {errors.employeeCode?.message}
        </FieldError>
      </div>
      <Feedback error={error} />
      <Button className="h-11 w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Menyimpan…" : "Simpan karyawan"}
      </Button>
    </form>
  )
}
export function ViolationEditor({
  violation,
  onSaved,
}: {
  violation?: Violation
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={violation ? "outline" : "default"}
            className="h-11"
          />
        }
      >
        {violation ? "Ubah" : "Tambah jenis kesalahan"}
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {violation ? "Ubah jenis kesalahan" : "Tambah jenis kesalahan"}
          </DialogTitle>
          <DialogDescription>
            Tarif default berlaku per orang. Perubahan master tidak mengubah
            catatan historis.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ViolationForm
            violation={violation}
            onSaved={() => {
              setOpen(false)
              onSaved()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
function ViolationForm({
  violation,
  onSaved,
}: {
  violation?: Violation
  onSaved: () => void
}) {
  const admin = useAdmin(),
    [error, setError] = useState("")
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof violationSchema>>({
    resolver: zodResolver(violationSchema),
    defaultValues: {
      code: violation?.code ?? "",
      name: violation?.name ?? "",
      category: violation?.category ?? "OTHER",
      defaultAmountPerPerson: violation?.defaultAmountPerPerson,
      description: violation?.description ?? "",
    },
  })
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setError("")
        try {
          await api(
            violation ? `/violation-types/${violation.id}` : "/violation-types",
            {
              method: violation ? "PATCH" : "POST",
              headers: { "X-CSRF-Token": admin.csrfToken },
              body: JSON.stringify({
                ...values,
                description: values.description || null,
              }),
            }
          )
          onSaved()
        } catch (err) {
          setError((err as Error).message)
        }
      })}
    >
      <div className="space-y-2">
        <label htmlFor="violation-code" className="text-sm font-medium">
          Kode
        </label>
        <Input
          autoFocus
          id="violation-code"
          className={`${fieldClass} uppercase`}
          maxLength={40}
          {...register("code")}
          aria-invalid={!!errors.code}
          aria-describedby="violation-code-error"
        />
        <FieldError id="violation-code-error">
          {errors.code?.message}
        </FieldError>
      </div>
      <div className="space-y-2">
        <label htmlFor="violation-name" className="text-sm font-medium">
          Nama jenis kesalahan
        </label>
        <Input
          id="violation-name"
          className={fieldClass}
          maxLength={120}
          {...register("name")}
          aria-invalid={!!errors.name}
          aria-describedby="violation-name-error"
        />
        <FieldError id="violation-name-error">
          {errors.name?.message}
        </FieldError>
      </div>
      <div className="space-y-2">
        <label htmlFor="violation-category" className="text-sm font-medium">
          Kategori
        </label>
        <select
          id="violation-category"
          className={selectClass}
          {...register("category")}
        >
          {Object.entries(categories).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="violation-amount" className="text-sm font-medium">
          Tarif default per orang (Rp)
        </label>
        <Input
          id="violation-amount"
          className={fieldClass}
          type="number"
          min={1}
          max={100000000}
          step={1}
          inputMode="numeric"
          {...register("defaultAmountPerPerson", { valueAsNumber: true })}
          aria-invalid={!!errors.defaultAmountPerPerson}
          aria-describedby="violation-amount-error"
        />
        <FieldError id="violation-amount-error">
          {errors.defaultAmountPerPerson?.message}
        </FieldError>
      </div>
      <div className="space-y-2">
        <label htmlFor="violation-description" className="text-sm font-medium">
          Deskripsi (opsional)
        </label>
        <textarea
          id="violation-description"
          rows={3}
          maxLength={1000}
          className={`${selectClass} h-auto p-3`}
          {...register("description")}
          aria-describedby="violation-description-error"
        />
        <FieldError id="violation-description-error">
          {errors.description?.message}
        </FieldError>
      </div>
      <Feedback error={error} />
      <Button className="h-11 w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Menyimpan…" : "Simpan jenis kesalahan"}
      </Button>
    </form>
  )
}
