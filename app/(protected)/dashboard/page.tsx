import { Suspense } from "react"
import { Dashboard } from "@/components/reporting/dashboard"
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Memuat ringkasan…</p>}>
      <Dashboard />
    </Suspense>
  )
}
