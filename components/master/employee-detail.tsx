"use client"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAdmin } from "@/components/admin-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import type { Employee } from "@/lib/master"
import { EmployeeEditor } from "./forms"
import {
  ConfirmAction,
  Feedback,
  FieldError,
  fieldClass,
  LoadState,
  Status,
  useResource,
} from "./shared"
const aliasSchema = z.object({
  aliasDisplay: z
    .string()
    .trim()
    .min(2, "Alias minimal 2 karakter.")
    .max(120, "Alias maksimal 120 karakter."),
})
export function EmployeeDetail({ id }: { id: string }) {
  const resource = useResource<Employee>(`/employees/${id}`),
    admin = useAdmin()
  const [error, setError] = useState(""),
    [message, setMessage] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof aliasSchema>>({
    resolver: zodResolver(aliasSchema),
    defaultValues: { aliasDisplay: "" },
  })
  const saved = (text: string) => {
    setError("")
    setMessage(text)
    resource.reload()
  }
  const employee = resource.data
  return (
    <div className="space-y-6">
      <Link
        href="/employees"
        className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
      >
        Kembali ke daftar karyawan
      </Link>
      <LoadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      >
        {employee && (
          <>
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 space-y-3">
                <p className="text-sm text-foreground/65">Profil karyawan</p>
                <h1 className="text-3xl font-semibold tracking-tight break-words">
                  {employee.displayName}
                </h1>
                <p className="text-sm text-foreground/65">
                  {employee.employeeCode ?? "Tanpa kode karyawan"}
                </p>
                <Status active={employee.isActive} />
              </div>
              <div className="flex flex-wrap gap-2">
                <EmployeeEditor
                  employee={employee}
                  onSaved={() => saved("Profil karyawan berhasil diperbarui.")}
                />
                <ConfirmAction
                  label={employee.isActive ? "Arsipkan" : "Aktifkan kembali"}
                  title={`${employee.isActive ? "Arsipkan" : "Aktifkan kembali"} ${employee.displayName}?`}
                  description={
                    employee.isActive
                      ? "Karyawan tidak muncul di pilihan aktif. Histori tetap tersimpan."
                      : "Karyawan akan muncul kembali dalam pilihan aktif."
                  }
                  path={`/employees/${id}/${employee.isActive ? "archive" : "restore"}`}
                  onDone={() =>
                    saved(
                      employee.isActive
                        ? "Karyawan diarsipkan."
                        : "Karyawan diaktifkan kembali."
                    )
                  }
                />
              </div>
            </header>
            <Feedback message={message} />
            <section className="space-y-5 rounded-xl border bg-background p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-semibold">Alias nama</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground/65">
                  Tambahkan nama panggilan untuk membantu pencarian. Alias hanya
                  boleh terhubung ke satu karyawan dan tidak menggabungkan
                  histori.
                </p>
              </div>
              {employee.aliases.length === 0 ? (
                <p className="text-sm text-foreground/65">Belum ada alias.</p>
              ) : (
                <ul className="divide-y">
                  {employee.aliases.map((alias) => (
                    <li
                      key={alias.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <span className="min-w-0 text-sm break-words">
                        {alias.aliasDisplay}
                      </span>
                      <ConfirmAction
                        label="Hapus alias"
                        title={`Hapus alias ${alias.aliasDisplay}?`}
                        description="Alias dihapus dari pencarian. Catatan kejadian tetap tersimpan."
                        path={`/employees/${id}/aliases/${alias.id}`}
                        method="DELETE"
                        onDone={() => saved("Alias berhasil dihapus.")}
                      />
                    </li>
                  ))}
                </ul>
              )}
              <form
                className="space-y-3 border-t pt-5"
                noValidate
                onSubmit={handleSubmit(async (values) => {
                  setError("")
                  setMessage("")
                  try {
                    await api(`/employees/${id}/aliases`, {
                      method: "POST",
                      headers: { "X-CSRF-Token": admin.csrfToken },
                      body: JSON.stringify(values),
                    })
                    reset()
                    saved("Alias berhasil ditambahkan.")
                  } catch (err) {
                    setError((err as Error).message)
                  }
                })}
              >
                <label
                  htmlFor="alias-name"
                  className="block text-sm font-medium"
                >
                  Alias baru
                </label>
                <div className="flex flex-wrap gap-3">
                  <Input
                    id="alias-name"
                    className={`${fieldClass} min-w-0 flex-1 basis-48`}
                    maxLength={120}
                    {...register("aliasDisplay")}
                    aria-invalid={!!errors.aliasDisplay}
                    aria-describedby="alias-error"
                  />
                  <Button
                    className="h-11"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Menyimpan…" : "Tambah alias"}
                  </Button>
                </div>
                <FieldError id="alias-error">
                  {errors.aliasDisplay?.message}
                </FieldError>
                <Feedback error={error} />
              </form>
            </section>
          </>
        )}
      </LoadState>
    </div>
  )
}
