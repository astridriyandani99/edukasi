# 📖 Panduan Portal Katalog E-Leaflet Edukasi Kesehatan

Portal web modern, interaktif, dan ramah pengguna untuk menyajikan katalog materi leaflet edukasi kesehatan dari Google Drive. Dilengkapi pencarian instan (*instant search*), filter kategori, pratinjau PDF langsung di web (*in-app modal*), sinkronisasi Google Sheets, dan pelacakan Google Analytics 4 (GA4).

---

## 🚀 Fitur Utama

1. **24 Leaflet Bawaan Siap Pakai**: Seluruh file dari folder Google Drive Anda sudah terindeks lengkap beserta thumbnail dan link unduhannya.
2. **Pencarian Real-Time (Instant Filter)**: Pengunjung cukup mengetik kata kunci (contoh: *"Ginjal"*, *"Hipertensi"*, *"Diet"*, *"Luka"*, dll) dan leaflet akan langsung tersaring seketika tanpa jeda reload halaman.
3. **Filter Kategori Dinamis**: Mengelompokkan materi ke dalam *Gizi & Nutrisi*, *Penyakit Dalam*, *Layanan & Pasien*, *Kesehatan Umum*, dan *Laboratorium & Diagnostik*.
4. **Pratinjau PDF Tanpa Keluar Halaman**: Pengunjung dapat membaca leaflet langsung di jendela popup/modal.
5. **Pelacakan Google Analytics 4 (GA4)**: Mencatat leaflet mana yang dibuka, diunduh, kata kunci yang dicari, dan link Drive yang diklik.
6. **Dukungan Google Sheets (No-Code Update)**: Menambah atau mengubah leaflet cukup dari spreadsheet, web otomatis terupdate!

---

## 📊 1. Cara Menghubungkan Google Analytics 4 (GA4)

Untuk melacak berapa banyak klik pada setiap leaflet:

1. Buka [Google Analytics](https://analytics.google.com/) dan login dengan akun Google Anda.
2. Klik menu **Admin** (ikon roda gigi di pojok kiri bawah) ➜ **Buat Properti** (*Create Property*).
3. Isi nama properti (contoh: *Katalog Leaflet PKRS*), pilih zona waktu Indonesia, dan mata uang Rupiah/USD.
4. Pada pilihan platform, pilih **Web**.
5. Masukkan URL website Anda (atau URL Vercel sementara) dan beri nama Stream (contoh: *Web Leaflet*).
6. Salin **Measurement ID** yang diawali huruf `G-` (contoh: `G-ABC123XYZ4`).
7. Buka file [`js/config.js`](file:///home/edogawa/antygravity/js/config.js), lalu ganti nilai berikut:
   ```javascript
   GA_MEASUREMENT_ID: "G-ABC123XYZ4", // ganti dengan ID Anda
   ```
8. Selesai! Setiap ada pengunjung yang melihat (*view*), mengunduh (*download*), atau mencari leaflet, datanya akan otomatis masuk ke dashboard Google Analytics Anda.

> **Tips Melihat Laporan Klik**:
> Di dashboard Google Analytics, buka menu **Laporan (Reports)** ➜ **Engagement** ➜ **Events**. Anda akan melihat nama event:
> - `leaflet_view`: Dibuka dalam popup
> - `leaflet_download`: Tombol unduh ditekan
> - `leaflet_search`: Kata kunci yang dicari pengunjung

---

## 📑 2. Cara Memperbarui Leaflet via Google Sheets

Jika Anda ingin mengelola daftar leaflet tanpa mengubah kode:

### Langkah A: Buat Spreadsheet di Google Sheets
Buat Google Sheet baru dengan susunan header kolom baris pertama (wajib sama):

| ID | Kode | Judul | Kategori | Deskripsi |
|---|---|---|---|---|
| 1WU7hDHDY6Q6vLtyQWxWPeLxpu0vNlCXV | GIZI-02 | DIIT HIPERTENSI | Gizi & Nutrisi | Panduan pola makan untuk pasien hipertensi. |
| 1EMG_41dUUtfFJawlMDKpgagdQ0D8F0_T | LP-07 | FLYER HAK DAN KEWAJIBAN PASIEN | Layanan & Pasien | Hak dan kewajiban pasien selama dirawat. |

> **Catatan Kolom `ID`**:
> Anda bisa memasukkan **File ID** saja atau **Link Lengkap Google Drive** file tersebut (misal: `https://drive.google.com/file/d/1ASLi0.../view`). Sistem akan otomatis mendeteksi ID file tersebut.

### Langkah B: Publikasikan Google Sheet ke Web
1. Di Google Sheets, klik menu **File** ➜ **Bagikan** (*Share*) ➜ **Publikasikan ke web** (*Publish to web*).
2. Pada dropdown format (default: *Halaman Web*), ubah menjadi **Nilai yang dipisahkan koma (.csv)**.
3. Klik tombol **Publikasikan** (*Publish*), lalu salin link yang muncul.
4. Buka file [`js/config.js`](file:///home/edogawa/antygravity/js/config.js) dan tempel link CSV tersebut:
   ```javascript
   GOOGLE_SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv",
   ```

---

## 🚀 3. Cara Mendeploy ke Vercel (Gratis)

Web ini murni dibuat dengan HTML, CSS modern, dan JavaScript tanpa perlu proses kompilasi (*zero build step*).

### Opsi A: Melalui Vercel CLI (Paling Cepat via Terminal)
Jika Anda memiliki akun Vercel:
```bash
# Login ke Vercel
npx vercel login

# Deploy ke production
npx vercel --prod
```

### Opsi B: Melalui GitHub / Dashboard Vercel
1. Upload folder proyek ini ke repositori **GitHub** Anda.
2. Buka [vercel.com](https://vercel.com) dan klik **Add New Project**.
3. Pilih repositori GitHub Anda.
4. Pada konfigurasi *Build and Output Settings*, biarkan default (*Other / Static*).
5. Klik **Deploy**. Website Anda akan langsung online dengan domain gratis seperti `leaflet-pkrs.vercel.app` (dan bisa dihubungkan ke custom domain instansi Anda).

---

## 📁 Struktur File Proyek

```
.
├── index.html            # Halaman utama aplikasi (SEO-friendly)
├── vercel.json           # Konfigurasi routing & keamanan Vercel
├── README.md             # Dokumentasi petunjuk penggunaan
├── css/
│   └── styles.css        # Desain antarmuka medis modern responsif
├── js/
│   ├── config.js         # Konfigurasi GA4 ID & Google Sheets URL
│   ├── analytics.js      # Modul pelacak Google Analytics 4
│   ├── data.js           # Parser CSV Google Sheets & Fallback data
│   └── app.js            # Interaksi UI, pencarian real-time, modal PDF
└── data/
    └── leaflets.json     # Data bawaan 24 leaflet dari Google Drive
```
