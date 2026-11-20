import type { paths } from "./api-schema"
export type Admin =
  paths["/api/v1/auth/me"]["get"]["responses"][200]["content"]["application/json"]["data"]
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: string[] = [],
    public retryable: boolean = false
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
      body.error?.details?.fields ?? [],
      body.error?.details?.retryable === true
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

export async function downloadCsv(path: string) {
  const response = await fetch("/api/v1" + path, {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "text/csv" },
  }).catch(() => {
    throw new Error("Layanan belum dapat dihubungi. Silakan ulangi.")
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    if (response.status === 401) {
      window.dispatchEvent(new Event("session-expired"))
      window.location.replace("/login")
    }
    throw new ApiError(
      body?.error?.message ?? "Ekspor gagal. Silakan ulangi.",
      response.status
    )
  }
  if (!response.headers.get("content-type")?.includes("text/csv"))
    throw new Error("Respons ekspor tidak valid. Silakan ulangi.")
  const blob = await response.blob(),
    url = URL.createObjectURL(blob),
    anchor = document.createElement("a")
  anchor.href = url
  anchor.download =
    response.headers
      .get("content-disposition")
      ?.match(/filename="([A-Za-z0-9._-]+)"/)?.[1] ?? "report.csv"
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
