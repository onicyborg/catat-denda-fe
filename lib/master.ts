import type { components } from "./api-schema"
export type Employee = components["schemas"]["EmployeeResponse"]
export type Violation = components["schemas"]["ViolationResponse"]
export type Page<T> = {
  data: T[]
  meta: components["schemas"]["PageMetaResponse"]
}
export const categories = {
  PREPARATION: "Kesalahan Racikan",
  SPILL: "Produk Tumpah",
  CLEANLINESS: "Kebersihan",
  INVENTORY_LOG: "Pencatatan Stok",
  ORDER: "Kesalahan Pesanan",
  OTHER: "Lainnya",
} satisfies Record<Violation["category"], string>
export const rupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
