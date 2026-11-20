# Redesign ruang kerja Catat Denda

20 November2026. Scope: layout aplikasi Next.js dan visualisasi dashboard. Implementasi menggunakan skill lokal ui-ux-pro-max yang diminta pemilik, ditinjau dengan antislop mode during dari preferensi global. Arah dan alasan keputusan tersimpan di DESIGN.md. Preset shadcn b1aIuQ2XC, stone/biru, Raleway, Base UI dan token chart tetap menjadi dasar.

## Hasil

- WorkspaceShell memisahkan sidebar desktop240px, header sticky, navigasi lokasi halaman, identitas administrator, toggle tema, logout dan main. Delapan tujuan navigasi yang sudah ada dikelompokkan Operasional/Data master/Administrasi. Mobile memakai dialog menu dengan Escape dan focus return, serta skip link menuju main.
- PageHeader menyatukan hierarchy judul, konteks, deskripsi dan aksi pada dashboard, master, kejadian, pembayaran, laporan, audit dan settings. Gutter16/24/32px dan maksimum1600px menjaga keterbacaan. Aksi membungkus di viewport sempit.
- Dashboard menyusun KPI2 kolom mobile/4 desktop, dua grafik, register terbaru dan draft. Settings memisahkan usaha dan keamanan akun ke dua kolom pada desktop/satu kolom mobile. Form tetap mempertahankan isian, validasi, konflik dan state sesi yang diuji sebelumnya.
- Donut Penyelesaian alokasi membandingkan **cohortNetPaidAmount dengan assessedAmount**, bukan periodNetPaidAmount. Sisa kohort memakai pola garis putus dan label/nominal; persentase dan nilai IDR selalu terlihat. Jika alokasi nol, tampil pesan kosong. Tidak menampilkan tren/delta yang tidak disediakan API.
- Batang horizontal membandingkan maksimal5 saldo outstanding lintas periode menurut filter identitas/jenis. Ranking memiliki skala maksimum bersama, nilai IDR terlihat, dan seluruh baris dapat dipilih dengan keyboard/touch untuk membuka karyawan. Rincian saldo masih dapat dibuka melalui disclosure.
- Grafik menggunakan SVG/CSS dan token chart preset, tanpa library/chart asset tambahan. Rasio dihitung menggunakan BigInt sebelum dibatasi menjadi persentase tampilan, menjaga integer uang. Tidak menulis balik nilai grafik ke data finansial.
- Pembacaan nama usaha dipusatkan dalam satu hook untuk header/sidebar. Request yang bersamaan digabung dan invalidation yang datang saat pending dijadwalkan ulang agar perubahan nama tetap terbaca. Nama150 karakter dibatasi dua baris dengan title lengkap dan tidak memperlebar layar320px.
- Placeholder dashboard statis mempertahankan ruang KPI/grafik saat loading; error/retry dan kondisi kosong tetap tersedia. Shared input/select memakai16px pada mobile untuk mengurangi auto-zoom iOS, lalu14px pada layar lebih lebar.

## Pemakaian ui-ux-pro-max

Pencarian design-system pertama mengembalikan rekomendasi pattern Enterprise Gateway yang tidak sesuai aplikasi internal. Query dipersempit ke admin dashboard data dense: style Data-Dense Dashboard relevan, tetapi pattern promosi tetap tidak diterapkan. Font/palette alternatif dari dataset tidak menggantikan preset pengguna. Pencarian domain chart memverifikasi horizontal bar untuk ranking dan donut untuk dua bagian dengan label/fallback; pencarian nextjs memverifikasi penggunaan Link/layout yang mempertahankan state. Dataset digunakan sebagai panduan, bukan instruksi atau desain final yang disalin mentah.

## Verifikasi akhir

| Check | Hasil |
|---|---|
| pnpm lint | PASS |
| pnpm typecheck | PASS |
| Next production build, .next-release terpisah | PASS |
| Full browser regressions |29/29 PASS,56.7detik |
| HTTPS production smoke |3/3 PASS,15.5detik: Chrome, Firefox, WebKit iPhone13 simulation |
| Dashboard warm mobile smoke |313ms lokal, latensi40ms,1.6Mbps down/0.75Mbps up,CPU4x,aset hangat,dataset QA kosong |
| New chart integration case | PASS real API+DB:50000 assessed,20000 dibayar kumulatif,30000 sisa,40%; cashflow Januari0 karena payment Februari |
| Full settlement | PASS pembayaran tambahan Maret →100% dan outstanding kosong, tanpa mencampurkan bulan cashflow |
| Empty selected period | PASS alokasi nol tidak menampilkan persentase palsu, ranking lintas periode tetap sesuai |
| Responsive/theme | PASS320/360/640/768/1024/1440/1920px, light/dark, tanpa overflow |
| Keyboard/touch | PASS menu Escape/focus return, navigasi nyata, baris ranking min44px, disclosure native |
| Text contrast | PASS pemeriksaan otomatis main/header/sidebar/dialog pada dua tema, ditambah pemeriksaan visual |
| Names/settings | PASS nama usaha150 karakter pada320px, konflik versi tetap mempertahankan isian |
| Auth/payment/export regressions | PASS login, password rotation/revoke, session expiry, ledger/reversal/conflict/retry, laporan/CSV |
| Contract/dependencies | Tidak menambah API/dependensi. Backend tetap main c2ee9a2, kontrak OpenAPI sama |

Skenario expired session dipastikan mengisi form dan menunggu request baca selesai sebelum menghapus cookie tepat sebelum submit, agar menguji expiry saat mutasi. Pemeriksaan actor pembayaran di-scope ke main karena header kini juga menampilkan nama admin. Suite penuh dijalankan dengan schema QA baru agar pemeriksaan empty master tidak tercampur fixture dari rehearsal visual sebelumnya.

Screenshot dashboard light/dark desktop/mobile berasal dari data sintetis yang berlabel QA pada schema disposable, bukan contoh yang dimasukkan ke database operasional. Screenshot dashboard, reports/settings serta halaman master/kejadian/payment/audit ditinjau. Full-page screenshot ketika scroll berada di tengah dapat menempatkan elemen fixed/sticky pada offset viewport; pemeriksaan visual final menggunakan capture dari scroll0.

Pengukuran313ms merupakan smoke navigasi lokal hingga respons data dan tombol siap, bukan field TTI/Lighthouse, bukan cold load atau janji performa produksi. WebKit Linux dengan simulasi iPhone belum menggantikan Safari/iOS fisik. Readiness staging/produksi tetap mengikuti gate Phase6. Tidak menjalankan deploy atau workflow GitHub.

## Delivery gate

Status berikut berlaku pada scope redesign dan didukung build,29 regresi UI,3 smoke produksi lokal, screenshot yang diperiksa dan keputusan DESIGN.md.

| Rule | Status/bukti |
|---|---|
| R-01 | PASS: permukaan netral dan satu aksen biru preset; tanpa glow/gradient dekoratif |
| R-02 | PASS: copy UI ringkas bahasa Indonesia, tanpa em dash baru |
| R-03 | PASS: overflow320–1920 dan nama150 karakter diuji |
| R-04 | PASS: satu keluarga Remix; file untuk kejadian, wallet untuk pembayaran, group untuk karyawan; ikon dekoratif aria-hidden |
| R-05 | PASS: hierarchy KPI/grafik/register berbeda sesuai tugas, gutter dan ritme4/8px konsisten |
| R-06 | PASS: Raleway dari preset pemilik, angka tabular pada data |
| R-07 | PASS: tidak menambah motif grid/dot dekoratif |
| R-08 | PASS: chevron hanya menunjukkan posisi breadcrumb, tanpa panah dekoratif tiap CTA |
| R-09 | PASS: tidak menambah badge/klaim pemasaran |
| R-10 | PASS: permukaan solid; tidak menambah glass |
| R-11 | PASS: radius panel dan navigasi dibedakan dari Button preset; tidak mengganti preset |
| R-12 | PASS: border/ruang menunjukkan kelompok, tanpa shadow massal |
| R-13 | PASS: tidak ada glow tambahan |
| R-14 | PASS: empat KPI mewakili ukuran domain; panel grafik/register berbeda berdasarkan isi |
| R-15 | PASS: aksi konkret Catat kejadian/Segarkan/Simpan, semua tujuan nyata |
| R-16 | PASS: tidak menambah jargon marketing |
| R-17 | PASS: semua angka produk dari API; fixture QA ditandai dan terisolasi |
| R-18 | PASS: tidak membuat testimonial |
| R-19 | PASS: tidak menambah entrance/loop chart; placeholder statis, MOTION0 |
| R-20 | PASS: motif register, tiga makna tanggal dan alokasi perorang sesuai pencatatan denda |
| R-21 | PASS: tema sistem/terang/gelap dan kontrol pengguna dipertahankan |
| R-22 | PASS: tidak menambah ilustrasi generik |
| R-23 | PASS: pemilik meminta redesign layout/grafik; tidak menambah logo/avatar atau aset marketing |
| R-24 | PASS: semua delapan navigasi dan drilldown menuju halaman nyata |
| R-25 | PASS: pemeriksaan kontras teks light/dark main/header/sidebar; label/pola melengkapi grafik |
| R-26 | PASS: navigasi, menu, theme, chart link, disclosure dan aksi bisnis diuji |
| R-27 | PASS: placeholder/loading/empty/error/retry tersedia dan regresi lulus |
| R-28 | PASS: tidak menambah FAQ |
| R-29 | PASS: stone/biru dan token semantik chart/sidebar yang ada |
| R-30 | PASS: layout diturunkan dari kebutuhan register yang ada, bukan replika produk tertentu |
| R-31 | PASS: alasan layout/chart/spacing dicatat di DESIGN.md |
| R-32 | PASS: skip link, native controls, menu Escape dan focus return teruji |
| R-33 | PASS: TSX ditulis melalui source patch, tanpa script pengganti UI/CSS |
| R-34 | PASS: tema terang/gelap diuji dan screenshot diperiksa |
| R-35 | PASS: aplikasi dibuild,29 interaksi regresi dan3 smoke HTTPS lulus |
| R-36 | PASS: hasil lokal dibedakan dari staging/produksi dan Safari fisik |
| R-37 | PASS: direction ENERGY2/RHYTHM3/MOTION0 dicatat sebelum desain, preset pemilik utama |
| R-38 | PASS: tidak ada konten operasional rekaan; semua sampel berlabel QA di database tes |
| R-39 | PASS: label/accessible names, native disabled/focus, min44px pada kontrol baru, tanpa motion baru |
| R-40 | PASS: tanpa media/skrip eksternal tambahan, placeholder ruang data dan angka performa hasil ukur |
| Liveliness | PASS: focal point KPI dan penyelesaian, whitespace memisahkan tugas, register dan pola chart menyatakan konteks denda |
| C-1 | PASS: semua perubahan memiliki tujuan navigasi, keterbacaan atau interpretasi data |
| C-2 | PASS: kontrol baru berfungsi dan tercakup tes |
| C-3 | PASS: komposisi mengikuti data dan workflow yang sudah ada |
| C-4 | PASS: viewport, tema, jaringan gagal, konflik dan expiry diuji |
| C-5 | PASS: tidak mengklaim data, performa atau deployment yang tidak diukur |

Pemeriksaan tambahan setelah review visual: targeted chart/keyboard test1/1 PASS (5.1detik), termasuk focus skip link ke main dan memastikan heading tidak tertutup sticky header. Lint/typecheck/production build diulang dan lulus setelah scroll margin disesuaikan. Preview dashboard1440×1050 diambil dari skenario40% dengan data QA yang sama.

## Kartu kejadian dan pagination (21 November 2026)

- Scope: daftar `/fines`; preset, tema, filter dan aturan backend tetap. Urutan backend `createdAt DESC, id DESC`; default enam kartu dengan pilihan 6/12/24.
- Kartu responsif satu/dua/tiga kolom. Seluruh area berupa satu Next Link, dengan label detail, hover/pressed feedback, dan fokus keyboard. Nominal draft belum lengkap tidak ditampilkan sebagai nol.
- Pengujian data sintetis memakai schema PostgreSQL QA terisolasi, bukan Neon produksi. Tiga pengujian kartu mencakup 13 kejadian, urutan pencatatan berbeda dari tanggal kejadian, klik peserta, Enter, fokus setelah paging, halaman terakhir, ukuran halaman, reset filter, loading, error/retry, hasil kosong, status POSTED/VOIDED, serta draft tidak lengkap.
- Empat pengujian browser kejadian yang sudah ada lulus: alokasi/posting/koreksi/filter/pembatalan, draft tidak lengkap, respons create hilang, dan respons posting hilang.
- Inspeksi screenshot light/dark pada 320/375/768/1440px dan landscape 812×375; tidak ada overflow horizontal, pemeriksaan kontras teks lulus, reduced motion aktif, target pagination 44px. Hover tombol filter diperkuat menjadi primary/90 setelah pemeriksaan menemukan kontras kurang.
- `pnpm lint`, `pnpm typecheck`, dan build produksi dengan `.next-release` berhasil. Screenshot QA: `/tmp/catat-denda-cards-{light,dark}-{320,375,768,1440}.png` (fixture sintetis).
