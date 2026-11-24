# Redesign UX, 24 November 2026

Tujuan pemilik: seluruh aplikasi lebih sederhana, terutama pada HP. Pencatatan/pembayaran dan pemeriksaan denda karyawan sama sering dipakai. Perubahan dikerjakan di frontend/main; transaksi, izin, audit, UUID dan API tetap menjadi sumber kebenaran.

## Masalah yang ditemukan dari audit antarmuka

1. Form filter tanggal/status/master mengambil hampir satu layar HP sebelum data pertama terlihat.
2. Delapan menu tersimpan dalam dialog; jalur harian, konfigurasi dan audit mempunyai bobot visual serupa.
3. Pembayaran dimulai dari daftar kejadian lalu detail peserta, walaupun pengguna mengenali karyawan lebih dahulu.
4. Halaman karyawan mendahulukan pengelolaan alias sebelum saldo dan riwayat.
5. Form denda menampilkan field sumber dan tanggal setara dengan pilihan kesalahan/karyawan; istilah posting, ledger dan kohort menuntut pengetahuan sistem.
6. Login dua panel dan ringkasan dengan banyak penjelasan membuat pekerjaan utama kurang menonjol.

Ini audit struktur dan alur, bukan hasil riset atau pengukuran waktu pengguna. UAT pengguna nyata tetap diperlukan untuk mengevaluasi kemudahan setelah perubahan.

## Perubahan alur

| Aktivitas | Sebelumnya | Setelah redesign |
| --- | --- | --- |
| Navigasi HP | Buka Menu untuk setiap perpindahan | Ringkasan, Denda, Catat, Karyawan selalu tersedia di bawah; administrasi di Lainnya |
| Cari denda | Melewati filter panjang | Pencarian langsung terlihat, filter lanjutan dibuka bila perlu |
| Catat denda | Isi seluruh field dan nominal | Pilih kesalahan → karyawan → periksa nominal. Deskripsi dan nominal otomatis dari jenis; dapat diubah |
| Catat pembayaran | Cari kejadian → peserta → pembayaran | Catat pembayaran → pilih karyawan → pilih denda → konfirmasi nominal |
| Lihat karyawan | Alias/profil mendahului keuangan | Saldo dan riwayat ditampilkan lebih awal; pengaturan alias diringkas |
| Ringkasan | Semua grafik/penjelasan tampil sekaligus | Aksi harian dan data utama lebih dahulu; grafik dan definisi dapat dibuka |
| Login | Dua panel penjelasan/ilustrasi | Satu form fokus dan ringkas |

Tidak menggabungkan pembayaran antarkejadian secara otomatis. Pembayaran tetap menggunakan target alokasi, CSRF dan idempotency key yang sama. Pembalikan penuh dan penguncian koreksi dengan riwayat pembayaran tetap berlaku. Data default tidak membuat transaksi tanpa konfirmasi pengguna.

## Arah visual

ENERGY1 / RHYTHM2 / MOTION1. Preset shadcn b1aIuQ2XC tetap: stone/biru, Raleway, Base UI, token semantik dan tema terang/gelap. Bentuk kontrol konsisten, ruang lebih padat pada kartu, target sentuh 44–48px. Tidak menambah ilustrasi/aset marketing. Ikon Remix yang sudah tersedia digunakan untuk navigasi dan tindakan.

Motion React memakai LazyMotion dan m, transisi masuk singkat 180ms dan indikator disclosure 150ms. prefers-reduced-motion dihormati. Lenis dipakai pada desktop/pointer presisi tanpa reduced motion. Sentuhan mobile, input, textarea, select dan dialog tetap memakai scroll native. ResizeObserver langsung mengikuti perubahan tinggi halaman agar scroll awal tidak tertunda. Bottom navigation memperhitungkan safe-area dan ruang bawah konten; dialog punya batas tinggi dan scroll internal.

## Verifikasi

Pengujian dilakukan dengan schema QA PostgreSQL lokal terisolasi, bukan data Neon produksi. Verifikasi mencakup autentikasi, tanggal WIB, nominal otomatis/manual, draft, posting/aktivasi, retry/idempotency, koreksi, pembatalan, pembayaran/pembalikan, saldo karyawan, filter/export, settings, tema, navigasi keyboard, kontras dan overflow pada layar kecil. Hasil akhir dicatat setelah pengujian selesai.

## Hasil verifikasi

- 34 skenario browser diperiksa: 32 lulus dalam suite menyeluruh dan dua pemeriksaan layout yang tersisa lulus setelah pengujian ulang dengan menunggu layout resize stabil.
- Pencatatan → jenis mengisi deskripsi/nominal → pilih karyawan → simpan → profil saldo → pembayaran sebagian melalui halaman baru berhasil.
- Retry create/post/payment/reversal, konflik edit/versi, concurrent overpayment, auth/password/logout dan filter/CSV/audit tetap lulus.
- Tema terang/gelap, viewport 320–1920, target sentuh, keyboard dan fokus, serta screenshot mobile diperiksa. Lenis diuji dengan wheel desktop, dinonaktifkan saat reduced motion, dan tidak diaktifkan untuk pointer touch.
- Lint, typecheck dan build produksi wajib lulus sebelum push.
- Pengujian memakai schema QA PostgreSQL sementara. Port web QA 3300 dipakai karena 3100 sedang digunakan proyek lain; layanan proyek lain tidak dihentikan. Tidak ada transaksi uji pada Neon deployment.
- Temuan yang diperbaiki: panel alias tetap terbuka setelah simpan; kalkulasi tinggi scroll Lenis mengikuti pemuatan konten tanpa debounce; pemeriksaan layout menunggu resize browser selesai.
