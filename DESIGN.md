# Arah tampilan login Catat Denda

## Redesign ruang kerja, November2026

Permintaan pemilik: seluruh layout lebih profesional dan dashboard memakai grafik, dengan preset yang sama. Direction ruang kerja: register operasional yang terstruktur, ENERGY2 / RHYTHM3 / MOTION0. Preset b1aIuQ2XC, stone/biru, Raleway, radius komponen serta Base UI tetap. Tidak ada aset marketing, avatar atau ilustrasi tambahan. Ikon Remix sesuai fungsi menu/transaksi, bukan dekorasi.

Sidebar desktop240px menetap dengan kelompok Operasional/Data master/Administrasi dari delapan halaman yang sudah tersedia. Header72px menjaga breadcrumb, identitas admin, tema dan logout dapat dijangkau. Ponsel memakai menu dialog yang ada, bukan sidebar yang dipadatkan. Skip link menuju main untuk pengguna keyboard. Panel konten memakai lebar maksimum1600px, gutter16/24/32px, ritme4/8px, permukaan background pada kanvas muted/35. Heading dan aksi halaman diseragamkan melalui PageHeader; form/feedback/empty state dan label tetap nyata. Settings memakai kolom usaha dan akses pada desktop, satu kolom pada ponsel.

Dashboard: empat KPI server tetap dibedakan menurut makna tanggal, lalu dua grafik dengan tujuan berbeda: proporsi penyelesaian kohort dan ranking sisa karyawan. Donut memakai alokasi POSTED periode, dibayar kumulatif/sisa kohort, bukan cashflow periode. Sisa chart memakai pola putus dan label; nilai rupiah/percentage selalu terlihat sebagai alternatif tekstual. Batang horizontal membandingkan maksimal lima karyawan dengan skala maksimum yang sama; ranking lintas periode mengikuti filter identitas/jenis. Perhitungan proporsi memakai BigInt sebelum dibulatkan, nilai rupiah final tetap integer server. Tidak membuat tren waktu, delta atau angka contoh yang tidak didukung API. Chart ringan SVG/CSS dengan token chart preset, tanpa dependensi tambahan atau animasi. Semua chart mempunyai empty/error/loading dan tautan ke detail/laporan nyata.

Grid KPI2/4 kolom agar ringkasan ponsel lebih ringkas; grafik1/2 kolom dan register terbaru/draft1/2 kolom mengikuti ruang yang tersedia. Catatan KPI rinci dan ikon disembunyikan di layar kecil; label dan penjelasan tanggal tetap tersedia. Nama150 karakter, integer besar, viewport320–1920, light/dark, keyboard/kontras wajib diuji. Grafik kosong menjelaskan sumber data, bukan menampilkan nominal fiktif. Rincian saldo masih tersedia lewat disclosure. Primary biru dipakai untuk pencatatan, selected state memakai sidebar token agar teks tetap memenuhi kontras. Tidak mengubah kebijakan bisnis, auth atau kontrak API.

Skill ui-ux-pro-max digunakan: pencarian system-wide mengembalikan style Data-Dense Dashboard, tetapi pattern Enterprise Gateway/promosi tidak sesuai aplikasi internal sehingga tidak diterapkan. Rekomendasi palette/font bukan pengganti preset pemilik. Pencarian domain chart menyarankan horizontal bar untuk ranking dan donut untuk dua bagian dengan label/fallback; stack nextjs menegaskan Link dan layout state preservation. Direction di atas adalah adaptasi yang sudah diperiksa, bukan hasil generator yang disalin mentah.

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

## Pembayaran Phase4

Buku pembayaran dan dialog transaksi untuk pengelola usaha, ENERGY1/RHYTHM2/MOTION0. Tetap memakai stone, primary biru, Raleway dan Base UI preset pemilik. Dialog menonjolkan sisa/nominal agar admin dapat meninjau pembayaran per peserta sebelum menyimpan; form dan footer membungkus pada layar sempit. Track grid dialog minmax(0,1fr) menjaga kontrol native tidak memperlebar isi; scroll vertikal mempertahankan akses saat tinggi layar terbatas. Riwayat memakai garis pemisah dengan tanggal efektif dan waktu pencatatan yang berbeda; tidak menambah statistik dekoratif. Tautan berwarna foreground pada tema gelap karena biru primary preset terlalu gelap untuk teks; warna primary tombol tetap dipertahankan. Tidak menambah aset, ikon atau motion.

## Ringkasan, laporan dan audit Phase5

Halaman administrasi untuk pengelola usaha; ENERGY1/RHYTHM2/MOTION0. Preset stone/biru, Raleway, Base UI dan radius diteruskan. Empat sel KPI adalah empat ukuran yang diwajibkan brief, menggunakan nilai server dengan label tanggal eksplisit; bukan statistik dekoratif. Register kohort/kejadian memberi detail setelah ringkasan; panel export dan jejak audit terpisah menurut tujuan tugas. Grid4/2/1 kolom menyesuaikan ruang, daftar membungkus menjadi blok vertikal di ponsel. Biru tetap untuk aksi utama; tautan memakai foreground+underline agar terbaca pada dua tema. Filter native bertanggal WIB dan pilihan master menyimpan kondisi pada URL. Nama usaha150 karakter dibungkus, header dibatasi dua baris dengan title lengkap; nama di laporan dan angka panjang dapat membungkus. Kolom sandi memakai batas field yang sama dengan form usaha untuk kontras. Tidak menambah logo, aset, ilustrasi, promosi, ikon atau animasi.

## Kartu kejadian dan pagination, November 2026

Permintaan pemilik: kartu dapat diklik seluruhnya, terbaru ke terlama, dengan pagination. ENERGY1 / RHYTHM2 / MOTION0; transisi warna 150ms memberi feedback hover/tekan, dinonaktifkan pada reduced motion. Preset stone/biru, Raleway, radius dan Base UI tetap. Grid satu/dua/tiga kolom mengikuti ruang. Satu Next Link meliputi kartu tanpa kontrol bersarang; kode, teks Lihat detail dan panah menunjukkan tujuan. Status draft berbatas putus dan label teks, status lainnya memakai permukaan muted. Ikon kalender/peserta memberi konteks metadata dari Remix yang sudah digunakan. Nominal draft tidak lengkap ditulis Belum lengkap agar tidak disalahartikan sebagai denda nol.

Urutan backend createdAt desc/id desc dipertahankan; label menjelaskan waktu pencatatan, bukan tanggal kejadian. Pagination server default enam, pilihan 6/12/24, hitungan rentang, nomor desktop, tombol sentuh 44px. Filter dan ukuran halaman mengembalikan ke halaman pertama. Perpindahan halaman memfokuskan judul hasil dengan live status jumlah. Loading statis, hasil kosong dan retry tersedia. Verifikasi meliputi klik metadata/nominal, Enter, paging/filter/ukuran server, kontras tema, reduced motion, nama panjang, seluruh status dan viewport 320–1440.
