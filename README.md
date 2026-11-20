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

Tes browser: jalankan `pnpm test:browser:server` di backend, lalu `pnpm test:e2e` di frontend (memerlukan Google Chrome). Playwright menyalakan frontend QA port3100 dengan output `.next-qa` agar terpisah dari dev server biasa. Hentikan server QA backend setelah selesai. Suite menguji login invalid/valid, form tetap terisi saat refocus/gangguan jaringan, expiry saat submit, password salah/benar, pencabutan sesi lain, logout, dan viewport360/1440px. Frontend/API operasional tidak memakai kredensial QA ini.

Login memakai field Username dan Kata sandi, dengan dukungan identifier email lama. Toggle tema dan visibilitas password tersedia. Arah visual pada DESIGN.md; panel kiri memakai animasi loop dompet/koin tanpa rincian keuangan, dengan tombol jeda dan dukungan reduced motion. Tes layout memeriksa viewport320/360/768/1440px, keyboard, tombol show/hide, tema terang/gelap, kontras teks dan placeholder.

Phase2 tersedia di `/employees`, `/employees/[id]`, dan `/mistake-types`. Master mendukung pencarian/filter/paging, profil, alias manual, edit, arsip/aktifkan kembali. Form memakai React Hook Form + Zod dan DTO backend; tipe response dihasilkan dari OpenAPI. Saldo dan histori keuangan karyawan mengikuti Phase5 setelah ledger tersedia. Form login kini controlled dengan nilai awal kosong, reset saat pageshow, dan autocomplete off. Password manager browser tetap dapat menawarkan kredensial tersimpan berdasarkan pengaturan pengguna.

Tes browser master memakai storageState QA yang dibuat backend test:browser:server, bukan login tambahan ke akun operasional. Jalankan suite sesudah menyalakan server QA baru agar database dan rate-limit terisolasi. Tidak ada snapshot data master yang ditanam di production.

## Phase3: kejadian denda

Menu Kejadian denda membuka `/fines`, form `/fines/new`, dan detail `/fines/[id]`. Filter status/tanggal WIB/karyawan/jenis, pencarian dan paging memakai backend. Form mendukung0–20 peserta pada draft, identitas mentah dari sumber, pilihan master aktif, tarif default per orang dan override individual. Mengganti jenis hanya memperbarui nominal yang belum diubah manual; nominal yang dimuat dari draft lama diperlakukan sebagai override agar tidak tertimpa. Draft/VOIDED tidak dihitung sebagai saldo aktif. Nilai total dan pembayaran final berasal dari API; preview lokal memakai integer, bukan float.

Simpan draft mempertahankan null untuk nominal/tanggal/identitas yang belum pasti. Posting membuat/menyimpan draft lalu menjalankan transisi memakai version; input dan ID tetap ada bila validasi gagal. Key create dan payload asli disimpan di memori selama form terbuka untuk memulihkan response yang hilang sebelum menerapkan edit berikutnya. Response posting yang hilang diverifikasi melalui GET pada draft yang sama sebelum mencoba ulang. Konflik409 mempertahankan input; tinjau detail terbaru sebelum menyimpan ulang. Tidak menyimpan data personal draft atau CSRF token di localStorage.

Detail menampilkan snapshot histori, alokasi, saldo backend, dan metadata lifecycle. Koreksi finansial hanya sebelum pernah ada ledger; setelah itu hanya deskripsi. Pembatalan memerlukan alasan dan saldo pembayaran bersih0. Ledger yang sudah ada dapat dibaca; pencatatan pembayaran/reversal tersedia pada Phase4. Browser QA tests/z-fines.spec.ts mencakup mobile320px/desktop1440px, tarif manual, posting/koreksi/void, kegagalan posting, response create/post terputus, stale version, keyboard, state error/empty dan regresi kontrak.

Kontrak Phase3 kompatibel dengan backend commit `8f91acf`. SHA-256 openapi.json: `aa96b0810eeac8afb572cd6d94b3e6e0181fc88af1b8a5146eb51fc67136548e`. Artifact kontrak disalin dan types dihasilkan lokal; build tidak mengimpor source backend.

## Phase4: pembayaran dan pembalikan

Detail kejadian POSTED menyediakan Catat pembayaran untuk setiap peserta yang masih mempunyai sisa. Nominal default sisa, dapat dibayar parsial; dialog menampilkan preview sisa sesudah dan saldo final tetap diperiksa backend. Metode Tunai/Transfer/Lainnya, tanggal efektif WIB dan catatan tersedia. Pembayaran pada master karyawan yang diarsipkan tetap dapat dicatat untuk alokasi historis.

`/payments` menyediakan history PAYMENT/REVERSAL dengan filter tanggal efektif WIB, karyawan dan jenis transaksi serta paging. `/payments/[id]` menampilkan nominal, tanggal efektif, waktu dicatat, aktor, metode, catatan, ID dan tautan referensi. Pembalikan memerlukan alasan, mengambil nominal penuh transaksi asli di server, dan menghasilkan entry baru. Case yang pernah mempunyai ledger tetap hanya dapat dikoreksi deskripsinya setelah seluruh pembayaran dibalik.

Key/payload transaksi tertunda disimpan pada state dialog selama halaman masih terbuka; penutupan dan pembukaan ulang dialog mempertahankannya. Koneksi/5xx/429/retryable409 mempertahankan isian yang dikunci dan menawarkan konfirmasi transaksi yang sama. Error definitif4xx mempertahankan input untuk koreksi atau Muat saldo terbaru. Aksi baru sesudah transaksi terkonfirmasi mendapat key baru. Reload penuh/navigasi meninggalkan state dalam memori; tinjau ledger terbaru sebelum membuat aksi baru. Tidak menyimpan credential atau catatan pembayaran pada localStorage. Success memperbarui saldo/detail dari backend; tidak mengedit settlement secara manual.

tests/zz-payments.spec.ts menguji UAT parsial/penuh/reversal/void, dua form concurrent, respons pembayaran/reversal terputus dan retry setelah dialog dibuka ulang, metadata, paging21 entry, filter tanggal efektif, empty/error recovery, keyboard/focus, kontras terang/gelap dan overflow halaman/dialog pada320px. Dialog menggunakan tanggal berpresisi menit secara default, mempertahankan presisi asli bila diperlukan agar reversal tidak mendahului pembayaran.

Kontrak Phase4 kompatibel dengan backend commit `375bbe4`. SHA-256 openapi.json kedua repo: `48c03a6d6f484a2e11315cc9c653ae11eda924a0a7ace2929f8ada3567b6186e`. Artifact ini menghasilkan lib/api-schema.d.ts; tidak ada import source lintas repo.

## Phase5: dashboard, laporan, audit dan pengaturan

Dashboard kini memakai `/dashboard/summary`: jumlah case/nominal menurut tanggal kejadian, pembayaran bersih menurut tanggal efektif, serta sisa seluruh POSTED saat ini lintas periode. List terbaru, draft dan karyawan sisa terbesar berasal dari backend. Filter karyawan/jenis berlaku pada seluruh ukuran terkait. Label tidak mengurangkan cashflow periode dari nominal periode untuk mengarang saldo.

`/reports` menyediakan rekap kohort per karyawan (case occurredAt periode, pembayaran kumulatif hingga kini), daftar kejadian dan CSV. Metrik tetap POSTED; status/undated hanya untuk daftar/CSV case. Hanya alokasi karyawan terpilih yang dijumlahkan. CSV mengikuti filter applied pada URL; download memakai fetch same-origin/no-store, memeriksa error dan content-type sebelum blob, memakai filename aman server. Batas aktual hari/baris ditampilkan dari metadata API. Hasil kosong mendapat header-only CSV, terlalu besar menampilkan422 tanpa menghapus filter. Pembayaran CSV mengikuti effectiveAt dan opsi kind; original/reversal tetap tersimpan walau case VOIDED.

Filter laporan/dashboard/profil finansial memakai URL from/to, employeeId, violationTypeId dan page terkait; reports menambah status, includeUndated, kind, casePage dan balancePage. Reload/bookmark mempertahankan filter. Tombol Segarkan mengambil saldo server terkini. Profil `/employees/[id]` sekarang menampilkan summary, kejadian kohort dan ledger efektif dengan paging; fitur alias/profil lama tetap ada.

`/audit-logs` read-only, filter waktu pencatatan WIB/aktor/aksi/entitas dan paging. Detail before/after dirender sebagai teks React pada pre-wrap, bukan HTML. Payload tampilan dibatasi/diwhitelist backend; tidak ada edit/delete audit atau credential. `/settings` menambahkan nama usaha dan referensi kebijakan, tetap memakai form change-password yang ada. Konflik versi mempertahankan input; reload pengaturan terbaru hanya atas aksi pengguna. Nama usaha memperbarui header dan metadata laporan; IDR/Asia/Jakarta tetap. GET settings tanpa row memakai fallback, tanpa provisioning/seed tersembunyi.

Semua route P0 tersedia. tests/zzz-reporting.spec.ts menambah4 skenario: cohort-cashflow lintas bulan dan filter employee/CSV/profil; dashboard retry/responsive/dark; audit filter/paging/payload; settings konflik dua tab, nama150 karakter dan brand. Seluruh suite27 test juga memeriksa regresi auth/master/fine/payment sebelumnya. Build App Router memakai Suspense untuk client query-string hooks sesuai dokumentasi Next yang terpasang.

Kontrak Phase5 kompatibel dengan backend commit `1be7466`. SHA-256 openapi.json: `cc5d7ff3b5a0cd953bd8f7bccd5c9cc4c6cc8cb4e806f86e6682bda75aea5cac`. Types dibuat dengan api:generate; kedua repo tetap mandiri.

## Phase6: release rehearsal

[ops/RELEASE.md](ops/RELEASE.md) menjelaskan build produksi dari lockfile, service loopback, compatibility BE/FE dan smoke HTTPS tiga engine. `pnpm test:release` membutuhkan server rehearsal lokal backend. `pnpm test:e2e` tetap memakai HTTP3100/3101 untuk regresi penuh. Ekspor CSV menunggu transisi filter URL selesai agar tidak mengirim filter sebelumnya. Preset shadcn tetap sama; CLI shadcn kini devDependency dengan patch minimatch transitif.

Rehearsal lokal selesai; staging, domain/certifikat CA, Safari/iOS fisik dan aktivasi backup/monitoring produksi belum diverifikasi. Tidak ada deployment/workflow otomatis pada fase ini.
