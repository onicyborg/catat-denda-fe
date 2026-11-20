import { Suspense } from "react"
import { Reports } from "@/components/reporting/reports"
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Memuat laporan…</p>}>
      <Reports />
    </Suspense>
  )
}
