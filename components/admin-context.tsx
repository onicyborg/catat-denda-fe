"use client"
import { createContext, useContext } from "react"
import type { Admin } from "@/lib/api"
export const AdminContext = createContext<Admin | null>(null)
export function useAdmin() {
  const admin = useContext(AdminContext)
  if (!admin) throw new Error("Sesi admin belum tersedia.")
  return admin
}
