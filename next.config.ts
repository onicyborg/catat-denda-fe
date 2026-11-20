import type { NextConfig } from "next"
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_TEST_DIST_DIR ?? ".next",
  async rewrites() {
    const api = new URL(
      (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3001")
        .trim()
        .replace(/\/+$/, "")
    )
    if (
      !["http:", "https:"].includes(api.protocol) ||
      api.username ||
      api.password ||
      api.pathname !== "/" ||
      api.search ||
      api.hash
    ) {
      throw new Error(
        "API_INTERNAL_URL harus origin HTTP/HTTPS tanpa path atau kredensial."
      )
    }
    return [
      {
        source: "/api/v1/:path*",
        destination: `${api.origin}/api/v1/:path*`,
      },
    ]
  },
}
export default nextConfig
