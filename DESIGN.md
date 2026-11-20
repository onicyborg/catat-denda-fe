# Arah tampilan login Catat Denda

Halaman akses admin untuk pengelola usaha. Arah visual: buku pencatatan operasional yang tenang, jelas dan mudah dipindai. ENERGY1 / RHYTHM2 / MOTION0.

- Preset shadcn b1aIuQ2XC tetap menjadi dasar: Base UI, stone, primary biru, Raleway, radius dan Button; Input ditambahkan melalui CLI dengan konfigurasi preset yang sama.
- Desktop memakai dua panel: konteks pencatatan di kiri, aksi masuk di kanan. Ponsel memakai intro ringkas dan form satu kolom agar tombol utama tetap mudah dijangkau.
- Motif pembukuan berupa garis antar alokasi dan total, terkait langsung dengan prinsip satu kejadian/banyak karyawan. Ilustrasi diberi label Contoh alokasi dan nama anonim; bukan data operasional.
- Ikon Remix file-list menandai catatan; eye/eye-off untuk visibilitas password; sun/moon untuk tema. Tidak ada logo raster, gambar stok, testimoni atau angka pengguna rekaan.
- Biru menekankan aksi masuk dan total ilustrasi. Teks accent gelap memakai foreground agar kontras tetap terbaca. Teks sekunder foreground/65 dan batas field eksplisit memperjelas form; bukan perubahan palet global.
- Form menggunakan label, autoComplete, focus, pesan error, pending state dan tombol tema/password dengan accessible name. Tidak ada tautan bantuan/reset ke fitur yang belum tersedia.
- Halaman tidak menampilkan credential bawaan. Provisioning akun dilakukan terpisah di backend.
