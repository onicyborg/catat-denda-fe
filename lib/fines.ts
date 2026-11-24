import type { components } from "./api-schema"
export type Fine = components["schemas"]["FineResponse"]
export const caseLabels = {
  DRAFT: "Draft",
  POSTED: "Aktif",
  VOIDED: "Dibatalkan",
}
export const settlementLabels = {
  UNPAID: "Belum dibayar",
  PARTIAL: "Dibayar sebagian",
  PAID: "Lunas",
}
export const money = (amount: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(BigInt(amount))
export const wib = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(iso)) + " WIB"
    : "Tanggal belum diisi"
export const localWib = (iso: string) =>
  new Date(new Date(iso).getTime() + 7 * 3600000).toISOString().slice(0, 16)
export const isoWib = (value: string) =>
  value ? new Date(value + ":00+07:00").toISOString() : null
