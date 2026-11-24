"use client"
import Link from "next/link"
import { Disclosure } from "@/components/workspace/disclosure"
import { PageHeader } from "@/components/workspace/page-header"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  categories,
  rupiah,
  type Employee,
  type Violation,
  type Page,
} from "@/lib/master"
import { EmployeeEditor, ViolationEditor } from "./forms"
import {
  ConfirmAction,
  Feedback,
  fieldClass,
  LoadState,
  Pager,
  selectClass,
  Status,
  useResource,
} from "./shared"
export function MasterList({ kind }: { kind: "employees" | "violations" }) {
  const employee = kind === "employees"
  const [search, setSearch] = useState(""),
    [q, setQ] = useState(""),
    [status, setStatus] = useState("ACTIVE"),
    [category, setCategory] = useState(""),
    [page, setPage] = useState(1),
    [message, setMessage] = useState("")
  const params = new URLSearchParams({
    q,
    status,
    page: String(page),
    limit: "20",
    ...(!employee && category ? { category } : {}),
  })
  const resource = useResource<Page<Employee | Violation>>(
    `/${employee ? "employees" : "violation-types"}?${params}`,
    true
  )
  const saved = (text: string) => {
    setMessage(text)
    setPage(1)
    resource.reload()
  }
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data master"
        title={employee ? "Karyawan" : "Jenis kesalahan"}
        description={
          employee
            ? "Pilih karyawan untuk melihat denda dan pembayaran."
            : "Atur jenis kesalahan dan nominal otomatis per karyawan."
        }
        actions={
          employee ? (
            <EmployeeEditor
              onSaved={() => saved("Karyawan berhasil ditambahkan.")}
            />
          ) : (
            <ViolationEditor
              onSaved={() => saved("Jenis kesalahan berhasil ditambahkan.")}
            />
          )
        }
      />
      <div className="space-y-4 rounded-xl border bg-background p-4">
        <form
          className="flex flex-wrap gap-3"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            setQ(search.trim())
            setMessage("")
          }}
        >
          <div className="min-w-0 flex-1 basis-52">
            <label
              htmlFor="master-search"
              className="mb-2 block text-sm font-medium"
            >
              {employee ? "Cari nama, kode, atau alias" : "Cari nama atau kode"}
            </label>
            <Input
              id="master-search"
              className={fieldClass}
              maxLength={120}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                employee ? "Nama, kode, atau alias" : "Nama atau kode"
              }
            />
          </div>
          <Button type="submit" variant="outline" className="h-11 self-end">
            Cari
          </Button>
          <div className="w-full">
            <Disclosure title="Filter data">
              <div className="grid gap-4 sm:grid-cols-2">
                {" "}
                <div className="basis-40">
                  <label
                    htmlFor="master-status"
                    className="mb-2 block text-sm font-medium"
                  >
                    Status
                  </label>
                  <select
                    id="master-status"
                    className={selectClass}
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value)
                      setPage(1)
                      setMessage("")
                    }}
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Diarsipkan</option>
                    <option value="ALL">Semua status</option>
                  </select>
                </div>
                {!employee && (
                  <div className="basis-52">
                    <label
                      htmlFor="master-category"
                      className="mb-2 block text-sm font-medium"
                    >
                      Kategori
                    </label>
                    <select
                      id="master-category"
                      className={selectClass}
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value)
                        setPage(1)
                      }}
                    >
                      <option value="">Semua kategori</option>
                      {Object.entries(categories).map(([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </Disclosure>
          </div>
        </form>
      </div>
      <Feedback message={message} />
      <LoadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
        empty={
          resource.data?.data.length === 0
            ? "Belum ada data yang sesuai. Tambahkan data baru atau ubah pencarian dan filter."
            : undefined
        }
      >
        <ul className="grid gap-3 md:grid-cols-2">
          {resource.data?.data.map((item) => {
            const endpoint = `/${employee ? "employees" : "violation-types"}/${item.id}`
            return (
              <li
                key={item.id}
                className="flex min-w-0 flex-col items-stretch justify-between gap-4 rounded-xl border bg-background p-4"
              >
                <div className="min-w-0 flex-1 basis-48 space-y-2">
                  {employee ? (
                    <Link
                      href={`/employees/${item.id}`}
                      className="font-semibold break-words underline-offset-4 hover:underline focus-visible:outline-2"
                    >
                      {(item as Employee).displayName}
                    </Link>
                  ) : (
                    <h2 className="font-semibold break-words">
                      {(item as Violation).name}
                    </h2>
                  )}
                  <p className="text-sm break-words text-foreground/65">
                    {employee
                      ? ((item as Employee).employeeCode ?? "Tanpa kode")
                      : `${(item as Violation).code} · ${categories[(item as Violation).category]}`}
                  </p>
                  {employee && (item as Employee).aliases.length > 0 && (
                    <p className="text-sm break-words text-foreground/65">
                      Alias:{" "}
                      {(item as Employee).aliases
                        .map((a) => a.aliasDisplay)
                        .join(", ")}
                    </p>
                  )}
                  {!employee && (
                    <p className="text-sm">
                      {rupiah((item as Violation).defaultAmountPerPerson)}{" "}
                      <span className="text-foreground/65">per orang</span>
                    </p>
                  )}
                  {!employee && (item as Violation).description && (
                    <p className="text-sm break-words text-foreground/65">
                      {(item as Violation).description}
                    </p>
                  )}
                  <Status active={item.isActive} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {employee ? (
                    <Link
                      href={`/employees/${item.id}`}
                      className="inline-flex h-11 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted focus-visible:outline-2"
                    >
                      Lihat detail
                    </Link>
                  ) : (
                    <ViolationEditor
                      violation={item as Violation}
                      onSaved={() =>
                        saved("Jenis kesalahan berhasil diperbarui.")
                      }
                    />
                  )}
                  <ConfirmAction
                    label={item.isActive ? "Arsipkan" : "Aktifkan kembali"}
                    title={`${item.isActive ? "Arsipkan" : "Aktifkan kembali"} ${employee ? (item as Employee).displayName : (item as Violation).name}?`}
                    description={
                      item.isActive
                        ? "Data tidak muncul di pilihan aktif, tetapi histori tetap tersimpan."
                        : "Data akan muncul kembali pada daftar dan pilihan aktif."
                    }
                    path={`${endpoint}/${item.isActive ? "archive" : "restore"}`}
                    onDone={() =>
                      saved(
                        item.isActive
                          ? "Data berhasil diarsipkan."
                          : "Data berhasil diaktifkan kembali."
                      )
                    }
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </LoadState>
      <Pager result={resource.data} page={page} onChange={setPage} />
    </div>
  )
}
