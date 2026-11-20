import Link from "next/link"
export default function Dashboard() {
  return (
    <section className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-foreground/65">Ruang kerja</p>
        <h1 className="text-3xl font-semibold">Ringkasan</h1>
        <p className="mt-3 text-sm text-foreground/65">
          Siapkan data karyawan dan jenis kesalahan sebelum mencatat kejadian.
        </p>
      </div>
      <div className="divide-y rounded-xl border bg-background">
        <Link
          className="block space-y-2 p-6 hover:bg-muted/40 focus-visible:outline-2"
          href="/employees"
        >
          <h2 className="text-lg font-semibold">Kelola karyawan</h2>
          <p className="text-sm text-foreground/65">
            Profil, kode, dan alias karyawan.
          </p>
        </Link>
        <Link
          className="block space-y-2 p-6 hover:bg-muted/40 focus-visible:outline-2"
          href="/mistake-types"
        >
          <h2 className="text-lg font-semibold">Kelola jenis kesalahan</h2>
          <p className="text-sm text-foreground/65">
            Kategori dan tarif default per orang.
          </p>
        </Link>
      </div>
    </section>
  )
}
