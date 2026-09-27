# Pantau MP-ASI — Puskesmas Moncongloe

Aplikasi web (PWA) untuk mencatat pemantauan MP-ASI anak 6–23 bulan: recall 24 jam untuk 8 kelompok pangan dan intervensi. Hasilnya bisa diunduh sebagai Excel yang formatnya persis template import MP-ASI e-PPGBM.

Versi 0.1 (prototipe, tahap 1). Data tersimpan di perangkat masing-masing. Sinkron ke Google Sheet menyusul di tahap 2.

## Isi folder

| File | Fungsi |
|---|---|
| `index.html` | aplikasi |
| `xlsx.full.min.js` | pustaka SheetJS untuk membaca dan menulis Excel (tersimpan lokal agar bisa dipakai offline) |
| `sw.js` | service worker, supaya aplikasi bisa dibuka tanpa sinyal |
| `manifest.webmanifest`, `icon-192.png`, `icon-512.png` | pengaturan agar aplikasi bisa dipasang di layar HP |

## Memasang di GitHub Pages

1. Buat repository baru di GitHub, misalnya `pantau-mpasi`.
2. Unggah semua file di folder ini ke repository (Add file → Upload files).
3. Buka **Settings → Pages**. Pada *Source*, pilih **Deploy from a branch**, lalu branch `main` dan folder `/ (root)`. Klik **Save**.
4. Tunggu 1–2 menit. Aplikasi akan tersedia di `https://<nama-akun>.github.io/pantau-mpasi/`.

## Memasang di HP petugas

1. Buka link aplikasi di **Chrome** (Android).
2. Pilih menu ⋮ → **Tambahkan ke Layar Utama** / **Instal aplikasi**.
3. Buka aplikasi sekali selagi ada sinyal. Setelah itu aplikasi bisa dibuka tanpa sinyal.

## Login awal

- Nama: **Koordinator**, PIN: **1234**. Segera ganti di Menu → Periode & petugas.
- Koordinator menambahkan 4 petugas gizi beserta PIN masing-masing.

## Alur kerja per periode (Maret, Juni, September, Desember)

1. **Koordinator:** Menu → Impor data sasaran. Pilih file *Daftar Anak Berdasarkan Status Gizi* dari e-PPGBM (bulan pemantauan dan/atau 1 bulan sebelumnya). Periksa pratinjau, lalu simpan.
2. **Petugas:** Sasaran → pilih anak → jawab 8 kelompok pangan + intervensi → Simpan.
3. **Koordinator:** Menu → Unduh Excel e-PPGBM, lalu unggah file tersebut di e-PPGBM.

## Catatan tahap 1 (sebelum sinkron Google Sheet)

- Data tersimpan di browser HP. Jangan hapus data browser/Chrome.
- Untuk memindahkan isian dari HP petugas ke laptop koordinator: Menu → Cadangan data → **Unduh file cadangan** di HP, kirim file .json ke koordinator, lalu koordinator memilih **Gabungkan dari file cadangan**.
- File .xls e-PPGBM yang sudah di-save ulang sebagai "Web Page" tidak bisa dibaca. Gunakan file asli dari e-PPGBM, atau save as .xlsx.
