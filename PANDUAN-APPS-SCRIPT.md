# Panduan Memasang Server Google Sheet — Pantau MP-ASI

Waktu yang dibutuhkan: sekitar 15 menit, di laptop, dengan akun Google yang akan menjadi pemilik data
(akun Gmail puskesmas atau nurfahmi.gizi@poltekkes-mks.ac.id).

## A. Membuat Google Sheet dan Apps Script

1. Buka **sheets.google.com** → buat spreadsheet kosong. Beri nama, misalnya **Data Pantau MP-ASI Moncongloe**.
2. Klik menu **Ekstensi → Apps Script**. Tab baru akan terbuka.
3. Di file `Code.gs`, hapus semua isinya, lalu tempel **seluruh isi file Code.gs** yang dikirim. Klik ikon **Simpan** (disket).
4. Di toolbar atas, pastikan fungsi yang dipilih adalah **setup**, lalu klik **Jalankan**.
5. Akan muncul permintaan izin. Klik **Tinjau izin** dan pilih akun Anda.
   - Kalau muncul "Google belum memverifikasi aplikasi ini": klik **Lanjutan** → **Buka … (tidak aman)** → **Izinkan**. Ini wajar untuk skrip buatan sendiri.
6. Setelah selesai, buka **Log eksekusi** di bagian bawah. Di sana ada **token rahasia** (24 karakter). Salin dan simpan token ini.
   - Token juga bisa dilihat kapan saja di Google Sheet lewat menu **Pantau MP-ASI → Tampilkan token** (menu ini muncul setelah Sheet dimuat ulang).

## B. Menerbitkan sebagai aplikasi web

1. Di editor Apps Script, klik **Terapkan → Deployment baru**.
2. Klik ikon roda gigi di samping "Pilih jenis", lalu pilih **Aplikasi web**.
3. Isi pengaturannya:
   - Deskripsi: `Pantau MP-ASI v0.2`
   - Jalankan sebagai: **Saya**
   - Yang memiliki akses: **Siapa saja**
4. Klik **Terapkan**, lalu salin **URL aplikasi web** (berakhiran `/exec`).

> **Kalau pilihan "Siapa saja" tidak tersedia** (akun Workspace kampus kadang membatasi), berarti admin kampus memblokirnya. Ulangi langkah A–B memakai akun Gmail puskesmas.

> Pengaturan "Siapa saja" hanya berarti server bisa *dihubungi*. Data tetap tidak bisa dibaca atau dikirim tanpa token yang benar.

## C. Menyambungkan aplikasi (laptop koordinator)

1. Buka aplikasi Pantau MP-ASI **versi GitHub Pages** di laptop, lalu login sebagai Koordinator.
2. Buka **Menu → Sambungan server**. Tempel URL aplikasi web dan token, lalu klik **Uji dan sambungkan**.
3. Semua data di laptop (sasaran, isian, akun petugas) otomatis terkirim ke Google Sheet.
4. Di halaman yang sama ada **Kode sambung**. Klik **Salin kode sambung**.

## D. Menyambungkan HP petugas

1. Kirim kode sambung ke tiap petugas lewat **pesan pribadi** (bukan grup WA).
2. Di HP petugas, buka aplikasi dan di layar login ketuk **Sambungkan perangkat ini**. Tempel kode, lalu ketuk **Sambungkan**.
3. Daftar sasaran dan akun petugas akan terunduh. Petugas lalu login dengan nama dan PIN masing-masing.

## Cara kerja sinkron

- Isian tersimpan di HP dulu, lalu dikirim otomatis saat ada sinyal: beberapa detik setelah menyimpan, saat sinyal kembali, dan setiap 2 menit.
- Status sinkron tampil di pojok kanan atas: *Tersinkron 19.30*, *3 belum terkirim*, *Offline · 2 antre*. Ketuk status itu untuk sinkron sekarang.
- Kalau dua petugas mengisi anak yang sama, isian yang terakhir disimpan yang dipakai. Anak tersebut diberi tanda **Diisi ganda**, dan keterangannya tercatat di kolom `catatan` pada Sheet.
- Periode aktif yang diubah koordinator akan ikut berubah di semua HP.

## Isi Google Sheet

| Tab | Isi |
|---|---|
| `sasaran` | anak 6–23 bulan per periode (hasil impor dan tambahan manual) |
| `pemantauan` | isian 8 kelompok pangan, skor, intervensi, petugas, waktu |
| `petugas` | akun petugas (PIN tersimpan dalam bentuk sandi, bukan angka aslinya) |
| `pengaturan` | periode aktif |
| `log` | catatan setiap pengiriman data (2.000 baris terakhir) |

Semua kolom berformat teks agar NIK 16 digit tidak berubah. **Jangan mengedit Sheet secara manual** saat petugas sedang bekerja. Perubahan data dilakukan lewat aplikasi.

## Keamanan

- Siapa pun yang memegang **kode sambung** bisa membaca data anak (termasuk NIK). Bagikan hanya ke petugas.
- Kalau kode sempat tersebar atau ada HP yang hilang: di Google Sheet pilih **Pantau MP-ASI → Buat token baru**, lalu sambungkan ulang laptop koordinator (Menu → Sambungan server → Putuskan → sambungkan dengan token baru) dan kirim kode sambung yang baru ke petugas.
- Batasi akses berbagi Google Sheet hanya untuk koordinator dan penanggung jawab program.

## Memperbarui kode di kemudian hari

Tempel kode baru di Code.gs → Simpan → **Terapkan → Kelola deployment** → ikon pensil → Versi: **Versi baru** → Terapkan. Dengan cara ini URL tetap sama, jadi HP tidak perlu disambungkan ulang.
