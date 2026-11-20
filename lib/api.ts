import type { paths } from "./api-schema"
export type Admin =
  paths["/api/v1/auth/me"]["get"]["responses"][200]["content"]["application/json"]["data"]
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: string[] = []
  ) {
    super(message)
  }
}
export async function apiEnvelope<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...options.headers },
  }).catch(() => {
    throw new Error("Layanan belum dapat dihubungi. Silakan ulangi.")
  })
  const body = await res.json().catch(() => {
    throw new Error("Layanan belum dapat dihubungi. Silakan ulangi.")
  })
  if (!res.ok) {
    if (res.status === 401 && path !== "/auth/login") {
      window.dispatchEvent(new Event("session-expired"))
      window.location.replace("/login")
    }
    throw new ApiError(
      Array.isArray(body.error?.message)
        ? body.error.message.join(". ")
        : (body.error?.message ?? "Permintaan gagal. Silakan ulangi."),
      res.status,
      body.error?.details?.fields ?? []
    )
  }
  return body
}
export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  return (await apiEnvelope<{ data: T }>(path, options)).data
}
