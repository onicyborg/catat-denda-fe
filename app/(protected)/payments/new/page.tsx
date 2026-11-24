import Link from "next/link"
import { PaymentRecorder } from "@/components/payments/recorder"
import { PageHeader } from "@/components/workspace/page-header"
export default function Page() {
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/payments"
        className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
      >
        Kembali ke pembayaran
      </Link>
      <PageHeader
        title="Catat pembayaran"
        description="Pilih karyawan, pilih denda, lalu isi nominal pembayaran."
      />
      <PaymentRecorder />
    </section>
  )
}
