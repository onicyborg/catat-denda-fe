import type { components } from "./api-schema"
export type Payment = components["schemas"]["PaymentResponse"]
export const methods = { CASH: "Tunai", TRANSFER: "Transfer", OTHER: "Lainnya" }
export const entryKinds = { PAYMENT: "Pembayaran", REVERSAL: "Pembalikan" }
export const ledgerLocal = (iso: string) => {
  const value = new Date(new Date(iso).getTime() + 7 * 3600000)
    .toISOString()
    .slice(0, 23)
  return value.endsWith(":00.000")
    ? value.slice(0, 16)
    : value.endsWith(".000")
      ? value.slice(0, 19)
      : value
}
export const ledgerIso = (value: string) =>
  new Date(value + (value.length === 16 ? ":00" : "") + "+07:00").toISOString()
export const validLedgerTime = (value: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value) &&
  Number.isFinite(
    Date.parse(value + (value.length === 16 ? ":00" : "") + "+07:00")
  )
