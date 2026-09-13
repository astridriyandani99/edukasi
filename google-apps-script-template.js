/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: Webhook Pelacak Pengunjung Leaflet PKRS
 * ============================================================================
 * 
 * CARA MEMASANG KE GOOGLE SPREADSHEET (Hanya 1-2 Menit):
 * 1. Buka Google Spreadsheet baru (atau spreadsheet Anda di Google Drive).
 * 2. Klik menu di atas: Ekstensi (Extensions) -> Apps Script.
 * 3. Hapus semua teks yang ada di jendela editor, lalu Salin & Tempel SEMUA kode file ini.
 * 4. Klik tombol Simpan (ikon disket 💾).
 * 5. Klik tombol "Terapkan" (Deploy) warna biru di pojok kanan atas -> pilih "Penerapan Baru" (New Deployment).
 * 6. Pada ikon gerigi 'Pilih jenis' (Select type), pilih "Aplikasi Web" (Web app).
 * 7. Isi kolom:
 *    - Deskripsi: Webhook Tracker Leaflet
 *    - Jalankan sebagai (Execute as): Saya (email Anda)
 *    - Siapa yang memiliki akses (Who has access): Siapa saja (Anyone) -> [PENTING!]
 * 8. Klik tombol "Terapkan" (Deploy). Jika muncul permintaan izin otorisasi Google, klik 'Beri Akses' (Advanced -> Go to unsafe).
 * 9. Salin URL Aplikasi Web (awalan: https://script.google.com/macros/s/...)
 * 10. Buka file `js/config.js` di website Anda, dan tempelkan URL tersebut ke:
 *     TRACKER_WEBHOOK_URL: "URL_YANG_DISALIN_TADI"
 * ============================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("LogPengunjung") || ss.getSheets()[0];

    // Buat header kolom otomatis jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Waktu (WIB)",
        "IP Address",
        "ID Pengunjung",
        "Kode Leaflet",
        "Judul Leaflet",
        "Kategori",
        "Aksi",
        "Perangkat"
      ]);
      sheet.getRange(1, 1, 1, 8)
        .setFontWeight("bold")
        .setBackground("#0284c7")
        .setFontColor("#ffffff")
        .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    var data = JSON.parse(e.postData.contents);

    // Tambahkan baris data pengunjung baru
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
      data.ip || "-",
      data.visitor_id || "-",
      data.leaflet_code || "-",
      data.leaflet_title || "-",
      data.leaflet_category || "-",
      data.action || "-",
      data.device || "-"
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  // Mengembalikan data log dalam format JSON agar dapat ditarik langsung oleh Dashboard Laporan Admin
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("LogPengunjung") || ss.getSheets()[0];
    var rows = sheet.getDataRange().getValues();
    
    if (rows.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }

    var result = [];
    // Urutkan dari baris terbaru (paling bawah di sheet) ke baris terlama
    for (var i = rows.length - 1; i >= 1; i--) {
      var row = rows[i];
      result.push({
        timestamp: row[0],
        ip: row[1],
        visitor_id: row[2],
        leaflet_code: row[3],
        leaflet_title: row[4],
        leaflet_category: row[5],
        action: row[6],
        device: row[7]
      });
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
