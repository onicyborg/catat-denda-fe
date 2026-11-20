import { Suspense } from "react"
import { AuditLogs } from "@/components/reporting/audit"
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Memuat audit…</p>}>
      <AuditLogs />
    </Suspense>
  )
}
