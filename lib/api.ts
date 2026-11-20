import type { paths } from "./api-schema"
export type Admin =
  paths["/api/v1/auth/me"]["get"]["responses"][200]["content"]["application/json"]["data"]
export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...options.headers },
  })
  const body = await res.json().catch(() => {
    throw new Error("Layanan belum dapat dihubungi. Silakan ulangi.")
  })
  if (!res.ok) {
    if (
      res.status === 401 &&
      path !== "/auth/login" &&
      path !== "/auth/change-password"
    )
      window.location.replace("/login")
    throw new Error(
      Array.isArray(body.error?.message)
        ? body.error.message.join(". ")
        : (body.error?.message ?? "Permintaan gagal. Silakan ulangi.")
    )
  }
  return body.data
}
