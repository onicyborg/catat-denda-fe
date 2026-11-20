# Release frontend

Frontend dan backend tetap dua repository/node_modules terpisah. Perubahan dikirim ke main; development tidak digabung otomatis. Tidak ada workflow deployment pada tahap ini.

Gunakan Node24/pnpm10.33.1, `pnpm install --frozen-lockfile`, lalu `API_INTERNAL_URL=http://127.0.0.1:3001 pnpm build`. Rewrites dikompilasi saat build; ganti internal URL sebelum build jika topologi berbeda. Browser tetap memakai /api/v1 pada origin HTTPS yang sama. Jangan memasukkan secret atau credential DB ke variabel NEXT_PUBLIC_*.

Template service `catat-denda-frontend.service` menjalankan Next.js pada loopback3000, restart on-failure, filesystem read-only kecuali .next/cache. Siapkan direktori cache dengan izin catat-web, runtime Node/path yang sesuai, dan nginx HTTPS sebelum aktivasi. Proxy /api/v1 langsung ke API, mempertahankan Host serta menimpa XFF; jangan mempublikasi port3000/3001. Template nginx, role DB, backup terenkripsi, migration, bootstrap, recovery dan monitoring dijelaskan pada ops/RUNBOOK.md di repository backend.

Simpan pasangan SHA FE/BE dan hash kontrak OpenAPI. Jalankan lint, typecheck, build, audit serta browser regressions sebelum mengaktifkan release. Jika gagal, ganti binary dengan pasangan sebelumnya hanya jika schema masih kompatibel; rollback database mengikuti rencana recovery backend, bukan downgrade otomatis.

`pnpm test:release` membutuhkan API disposable production pada3201 (backend `RELEASE_QA=true node scripts/serve-browser-qa.mjs`), Next production .next-release pada3200, dan nginx lokal HTTPS localhost3443 memakai template backend. Build rehearsal memakai `NEXT_TEST_DIST_DIR=.next-release pnpm build`, start memakai variabel yang sama. Chromium/Firefox/WebKit harus sudah tersedia. Sertifikat self-signed dan ignoreHTTPSErrors hanya untuk rehearsal localhost; produksi wajib sertifikat CA valid. Metadata credential QA0600 dibuat backend di /tmp dan dihapus saat SIGINT/SIGTERM. Jangan menunjuk runner QA ke data produksi.

Smoke tiga engine memeriksa login kosong, cookie Secure, data API no-store, origin/CSRF, halaman privat dan logout. Chrome mengukur dashboard hangat pada latency40ms, unduh1.6Mbps, unggah0.75Mbps, CPU4x. Ini simulasi lokal, tidak menggantikan pengujian Safari/iOS nyata atau staging. Untuk `pnpm test:e2e`, gunakan server QA HTTP3101 biasa yang baru agar schema dan rate limiter bersih.
