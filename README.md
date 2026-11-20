# Frontend Catat Denda

Next.js dengan preset shadcn `b1aIuQ2XC` (`--template next --pointer`). Proyek ini mandiri dari backend, termasuk dependency dan lockfile pnpm.

```bash
pnpm install
pnpm dev
```

Buka `http://localhost:3000`. Halaman produk akan dibuat setelah brief disepakati.

Pemeriksaan: `pnpm lint`, `pnpm typecheck`, dan `pnpm build`.

Phase1: `/login`, `/dashboard`, `/settings`. Shell privat memverifikasi sesi via `/api/v1/auth/me`, menampilkan loading sebelum data, memeriksa ulang saat fokus dan setiap60detik. Session expired mengarahkan ke login. API memverifikasi sesi pada setiap request. Cookie tidak disimpan di localStorage.

Proxy API menuju API_INTERNAL_URL (server-only, default `http://127.0.0.1:3001`). Backend APP_BASE_URL harus origin browser (default `http://localhost:3000`). Untuk lingkungan production wajib HTTPS dan NODE_ENV=production di backend.

Kontrak disalin dari OpenAPI backend ke `openapi.json`. `pnpm api:generate` menghasilkan `lib/api-schema.d.ts`; type Admin berasal dari response auth/me. Jalankan generate ulang setelah mengganti artifact. Tidak ada import source atau dependency dari folder backend.
