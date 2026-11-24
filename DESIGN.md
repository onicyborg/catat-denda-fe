# Catat Denda — arah UX dan tampilan

## Dasar

Redesign 24 November 2026 menggantikan arah layout sebelumnya. Aplikasi internal untuk pengelola usaha yang sama sering mencatat denda/pembayaran dan memeriksa denda karyawan. Utamakan tiga pekerjaan tersebut, terutama pada HP. ENERGY1 / RHYTHM2 / MOTION1.

Preset shadcn b1aIuQ2XC dipertahankan: stone/biru, Raleway, Base UI dan token semantik. Permukaan datar, border ringan, radius kontrol konsisten, tanpa aset marketing atau ilustrasi tambahan. Ikon Remix yang sudah tersedia menunjukkan fungsi. Primary biru untuk aksi utama, foreground untuk teks agar kontras kedua tema terjaga. Target sentuh minimal 44px; teks input mobile 16px.

## Navigasi dan hierarki

Desktop: sidebar 224px dan header ringkas. Mobile: Ringkasan, Denda, Catat, Karyawan, Lainnya pada navigasi bawah; administrasi dan pembayaran tetap tersedia di Lainnya. Safe-area dan ruang bawah konten menjaga tombol/field terakhir tidak tertutup. Header detail mempunyai kembali ke daftar. Nama usaha panjang dipotong di header agar kontrol tetap dapat dijangkau; nama penuh tetap tersedia di pengaturan.

Ringkasan: aksi mencatat, pembayaran, dan denda karyawan lebih dahulu; angka asli server mengikuti periode. Grafik tetap tersedia melalui disclosure, dengan label dan alternatif tekstual. Tidak membuat angka atau tren buatan. Halaman karyawan mendahulukan saldo/riwayat; pengelolaan alias berada dalam panel terpisah yang tetap terbuka setelah penyimpanan.

## Form dan data

Pencarian sederhana terlihat; tanggal/status/jenis/master disimpan dalam panel filter. Panel menampilkan periode yang sudah diterapkan, bukan tanggal yang belum disimpan. Semua filter, pagination, error/retry dan keadaan kosong tetap tersedia. Daftar kejadian berupa kartu lebih ringkas dengan satu tautan untuk seluruh area, urutan createdAt desc/id desc dan pagination server 6/12/24.

Catat denda: pilih kesalahan, pilih karyawan, periksa nominal, simpan. Jenis mengisi deskripsi bila masih kosong serta tarif untuk nominal otomatis. Input yang sudah diubah manual dipertahankan. Tanggal default sekarang dan catatan sumber dapat diubah melalui panel tambahan. Nama sumber yang belum terhubung tetap dapat disimpan sebagai draft melalui opsi khusus. Draft belum menjadi tagihan; aktivasi tetap memerlukan isian lengkap. Istilah utama memakai Aktif, Simpan denda, dan Riwayat pembayaran.

Catat pembayaran: pilih karyawan, pilih denda, isi nominal, konfirmasi. Setiap pembayaran tetap terikat pada satu alokasi; tidak ada penggabungan diam-diam. Riwayat, pembalikan, CSRF, idempotency, konflik versi dan penguncian koreksi tetap memakai mekanisme yang sudah diuji. Nominal draft tidak lengkap tidak diganti nol pada kartu.

Login satu panel ringkas dengan field kosong secara default. Label, visibilitas sandi, feedback, pemulihan sesi, dan tema tetap tersedia.

## Motion dan scroll

Motion React memakai LazyMotion/m: masuk halaman 180ms dengan opacity/translate 6px, indikator panel 150ms. prefers-reduced-motion dihormati. Tidak ada animasi loop. Lenis dimuat dinamis hanya untuk pointer presisi tanpa reduced motion; layar sentuh tetap memakai scroll native. Scroll textarea/input/select/dialog dilewatkan ke browser. ResizeObserver mengikuti perubahan tinggi halaman tanpa menunggu debounce; observer, listener dan RAF dibersihkan saat dinonaktifkan.

## Validasi

Gunakan data QA terisolasi, bukan data deployment. Periksa alur denda → profil karyawan → pembayaran, pengiriman ulang/idempotency, konflik, pembalikan, auth/logout, filter/CSV, keyboard/fokus, tema terang/gelap, reduced motion, touch native dan viewport 320–1920. Detail audit serta definisi keuangan tetap dapat dibuka. Evaluasi pengguna nyata tetap diperlukan; audit ini tidak mengklaim pengukuran waktu penyelesaian tugas.
