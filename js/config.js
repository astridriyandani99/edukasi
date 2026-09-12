/**
 * Konfigurasi Utama Portal Katalog Leaflet
 * Anda dapat menyesuaikan konfigurasi di bawah ini sesuai kebutuhan instansi/rumah sakit Anda.
 */
window.APP_CONFIG = {
  // Nama Portal & Instansi
  APP_TITLE: "Portal Leaflet Edukasi Kesehatan",
  APP_SUBTITLE: "Pusat Informasi & Edukasi Kesehatan Pasien",
  INSTITUTION_NAME: "Promosi Kesehatan Rumah Sakit (PKRS)",
  
  // Link Folder Google Drive Utama
  DRIVE_FOLDER_URL: "https://drive.google.com/drive/folders/1ASLi0aywt5GY4lGBEa2k-ahepXTaV5ND?usp=sharing",

  /**
   * GOOGLE ANALYTICS 4 (GA4)
   * Masukkan Measurement ID Anda di sini (Contoh: 'G-ABC123XYZ4').
   * Jika masih kosong ('G-XXXXXXXXXX' atau ''), sistem akan berjalan dalam mode testing di console.
   */
  GA_MEASUREMENT_ID: "G-XXXXXXXXXX",

  /**
   * SINKRONISASI GOOGLE SHEETS (Opsional)
   * Jika Anda ingin memperbarui leaflet via Google Sheet:
   * 1. Buat Google Sheet dengan kolom: ID, Kode, Judul, Kategori, Deskripsi
   * 2. Klik File -> Bagikan -> Publikasikan ke web -> Pilih format CSV.
   * 3. Tempel link CSV tersebut di bawah ini.
   * Jika dibiarkan kosong (""), aplikasi akan otomatis menggunakan data lokal 'data/leaflets.json'.
   */
  GOOGLE_SHEET_CSV_URL: "",

  // Pengaturan Tampilan
  ITEMS_PER_PAGE: 12,
  ENABLE_PDF_MODAL: true, // Buka preview PDF di dalam popup modal
  ENABLE_DEBUG_LOGS: true  // Menampilkan info tracking di browser console
};
