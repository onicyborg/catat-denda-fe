# Arah tampilan login Catat Denda

Halaman akses admin untuk pengelola usaha. Arah visual: buku pencatatan operasional yang tenang, jelas dan mudah dipindai. ENERGY1 / RHYTHM2 / MOTION1.

- Preset shadcn b1aIuQ2XC tetap menjadi dasar: Base UI, stone, primary biru, Raleway, radius dan Button; Input ditambahkan melalui CLI dengan konfigurasi preset yang sama.
- Desktop memakai dua panel: konteks pencatatan di kiri, aksi masuk di kanan. Ponsel memakai intro ringkas dan form satu kolom agar tombol utama tetap mudah dijangkau.
- Panel visual memakai ilustrasi SVG dompet/koin tanpa nominal, nama karyawan atau rincian keuangan, sesuai revisi pemilik. Gerakan loop lembut memberi konteks keuangan; tombol jeda/lanjut tersedia dan prefers-reduced-motion menonaktifkan animasi. Ilustrasi desktop disembunyikan pada layar kecil agar form tetap ringkas.
- Ikon Remix file-list menandai catatan; eye/eye-off untuk visibilitas password; sun/moon untuk tema. Tidak ada logo raster, gambar stok, testimoni atau angka pengguna rekaan.
- Biru menekankan aksi masuk serta aksen dompet/koin. Teks accent gelap memakai foreground agar kontras tetap terbaca. Teks sekunder foreground/65 dan batas field eksplisit memperjelas form; bukan perubahan palet global.
- Form menggunakan label, autoComplete, focus, pesan error, pending state dan tombol tema/password dengan accessible name. Tidak ada tautan bantuan/reset ke fitur yang belum tersedia.
- Halaman tidak menampilkan credential bawaan. Provisioning akun dilakukan terpisah di backend.

## Halaman master Phase2

ENERGY1 / RHYTHM2 / MOTION0. Daftar dipisahkan garis seperti register operasional; tidak memakai statistik hias. Sidebar desktop memisahkan navigasi dari data, sedangkan tombol Menu membuka dialog navigasi pada ponsel. Form create/edit berada pada dialog preset Base UI; konfirmasi arsip menjelaskan efek pada pilihan aktif dan histori. Teks sekunder foreground/65, input/select jelas dan target sentuh minimal44px. Aksi penting tetap terlihat tanpa tabel horizontal pada layar kecil. Tidak ada tautan ke modul yang belum tersedia.

## Halaman kejadian Phase3

Register dan form administrasi untuk pengelola usaha; ENERGY1 / RHYTHM2 / MOTION0. Daftar menggunakan garis pemisah dan informasi status nyata. Form memisahkan kejadian, deskripsi dan alokasi per orang; total menjadi titik fokus kedua setelah judul. Biru untuk aksi posting serta tautan kejadian. Preset, Raleway, Base UI, tema dan radius tetap mengikuti fondasi yang ada. Tidak ada ilustrasi tambahan atau angka hias. Pada ponsel setiap alokasi ditumpuk menjadi nama, nominal dan aksi agar tidak membutuhkan scroll horizontal. Filter master memakai dialog berpencarian/paging, tidak mengunduh seluruh data. Focus, pending, draft belum lengkap, konflik dan koneksi gagal mempunyai state eksplisit; tidak menambah animasi untuk tugas pencatatan.
