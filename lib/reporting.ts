import type { components } from "./api-schema"
export type ReportSummary = components["schemas"]["ReportSummaryResponse"]
export type ReportBalance = components["schemas"]["BalanceResponse"]
export type ReportCase = components["schemas"]["CaseReportResponse"]
export type DashboardData = components["schemas"]["DashboardResponse"]
export type SettingsData = components["schemas"]["SettingsResponse"]
export type AuditRow = components["schemas"]["AuditResponse"]
export type AuditOptions = components["schemas"]["AuditOptionsResponse"]
export function currentMonth() {
  const date = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10)
  return {
    from: date.slice(0, 7) + "-01",
    to: new Date(
      Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 0)
    )
      .toISOString()
      .slice(0, 10),
  }
}
export const reportParams = (values: Record<string, string | undefined>) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values))
    if (value) params.set(key, value)
  return params.toString()
}
