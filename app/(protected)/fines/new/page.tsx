import Link from "next/link"
import { FineForm } from "@/components/fines/form"
export default function Page() {
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/fines"
        className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
      >
        Kembali ke daftar kejadian
      </Link>
      <div>
        <p className="mb-2 text-sm text-foreground/65">Pencatatan baru</p>
        <h1 className="text-2xl font-semibold">Catat kejadian</h1>
        <p className="mt-3 text-sm text-foreground/65">
          Pilih jenis kesalahan dan karyawan. Nominal akan terisi otomatis.
        </p>
      </div>
      <FineForm />
    </section>
  )
}
