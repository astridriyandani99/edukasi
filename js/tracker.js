/**
 * Modul Pelacakan Pengunjung Mandiri (Unique Visitor & IP Tracker)
 * Bertanggung jawab:
 * 1. Mendeteksi IP Address dan Device ID unik pengunjung.
 * 2. Mencatat setiap interaksi leaflet (Baca Pratinjau, Unduh, Buka Drive).
 * 3. Mengirim log secara otomatis ke Webhook Google Sheets dan penyimpanan lokal.
 */
(function (window) {
  const LOCAL_STORAGE_KEY = "pkrs_activity_logs";
  const VISITOR_ID_KEY = "pkrs_visitor_id";
  const IP_SESSION_KEY = "pkrs_cached_ip";
  const MAX_LOCAL_LOGS = 500;

  const Tracker = {
    visitorId: null,
    cachedIp: null,
    isIpResolving: false,

    /**
     * Inisialisasi Tracker
     */
    init: function () {
      this.visitorId = this.getOrCreateVisitorId();
      this.resolveIpAddress();
    },

    /**
     * Dapatkan atau buat Visitor ID unik yang persisten di browser pengguna
     */
    getOrCreateVisitorId: function () {
      let id = localStorage.getItem(VISITOR_ID_KEY);
      if (!id) {
        const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
        id = `USR-${rand}`;
        try {
          localStorage.setItem(VISITOR_ID_KEY, id);
        } catch (e) {
          console.warn("LocalStorage tidak dapat diakses:", e);
        }
      }
      return id;
    },

    /**
     * Dapatkan tipe perangkat pengunjung (Mobile / Desktop / OS)
     */
    getDeviceType: function () {
      const ua = navigator.userAgent || "";
      if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
        return "iPhone / iOS";
      }
      if (/Android/.test(ua)) {
        return "Android";
      }
      if (/Windows/i.test(ua)) {
        return "Windows PC";
      }
      if (/Macintosh|Mac OS X/i.test(ua)) {
        return "Mac OS";
      }
      if (/Linux/i.test(ua)) {
        return "Linux";
      }
      return "Perangkat Lain";
    },

    /**
     * Ambil IP Address publik pengunjung secara cepat dan simpan di cache sesi
     */
    resolveIpAddress: async function () {
      // Cek cache sesi terlebih dahulu
      const cached = sessionStorage.getItem(IP_SESSION_KEY);
      if (cached) {
        this.cachedIp = cached;
        return cached;
      }

      if (this.isIpResolving) return this.cachedIp || "Memuat...";
      this.isIpResolving = true;

      try {
        // Coba layanan lookup IP tercepat dengan batas waktu 3 detik
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch("https://api.ipify.org?format=json", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.ip) {
            this.cachedIp = data.ip;
            sessionStorage.setItem(IP_SESSION_KEY, data.ip);
            return data.ip;
          }
        }
      } catch (err) {
        // Fallback jika layanan pertama dicegah oleh ekstensi / adblocker
        try {
          const res2 = await fetch("https://ipapi.co/json/", { cache: "no-store" });
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2 && data2.ip) {
              this.cachedIp = data2.ip;
              sessionStorage.setItem(IP_SESSION_KEY, data2.ip);
              return data2.ip;
            }
          }
        } catch (e2) {
          // Jika offline atau gagal, gunakan label anonim
          this.cachedIp = "IP Tidak Terdeteksi";
        }
      } finally {
        this.isIpResolving = false;
      }

      if (!this.cachedIp) this.cachedIp = "Anonim / Lokal";
      return this.cachedIp;
    },

    /**
     * Format Waktu Lokal (WIB)
     */
    getFormattedTimestamp: function () {
      const now = new Date();
      return now.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },

    /**
     * Catat aksi pembacaan leaflet / interaksi
     */
    trackAction: async function (actionType, leaflet) {
      if (!leaflet) return;

      const ip = this.cachedIp || (await this.resolveIpAddress());
      const timestamp = this.getFormattedTimestamp();
      const device = this.getDeviceType();

      const logItem = {
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: timestamp,
        iso_time: new Date().toISOString(),
        ip: ip,
        visitor_id: this.visitorId,
        leaflet_id: leaflet.id || "-",
        leaflet_code: leaflet.code || "-",
        leaflet_title: leaflet.title || "-",
        leaflet_category: leaflet.category || "Umum",
        action: actionType, // "Pratinjau Leaflet", "Unduh PDF", "Buka Drive"
        device: device,
      };

      // 1. Simpan ke Local Storage Mirror (untuk pratinjau instan di Laporan)
      this.saveToLocalLogs(logItem);

      // 2. Kirim ke Webhook Google Sheets jika URL sudah dikonfigurasi
      this.sendToGoogleSheetsWebhook(logItem);

      if (window.APP_CONFIG?.ENABLE_DEBUG_LOGS) {
        console.log("%c📝 [Visitor Tracker]", "color: #0284c7; font-weight: bold;", logItem);
      }
    },

    /**
     * Simpan log ke browser localStorage (maksimal 500 riwayat terbaru)
     */
    saveToLocalLogs: function (logItem) {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        let logs = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(logs)) logs = [];

        logs.unshift(logItem); // Masukkan di paling atas
        if (logs.length > MAX_LOCAL_LOGS) {
          logs = logs.slice(0, MAX_LOCAL_LOGS);
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
      } catch (err) {
        console.warn("Gagal menyimpan log lokal:", err);
      }
    },

    /**
     * Ambil seluruh riwayat log dari localStorage
     */
    getLocalLogs: function () {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    /**
     * Hapus riwayat log lokal
     */
    clearLocalLogs: function () {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return true;
      } catch (e) {
        return false;
      }
    },

    /**
     * Kirim data log ke Webhook Google Apps Script di latar belakang
     */
    sendToGoogleSheetsWebhook: function (logItem) {
      const webhookUrl = window.APP_CONFIG?.TRACKER_WEBHOOK_URL;
      if (!webhookUrl || !webhookUrl.startsWith("https://script.google.com")) {
        return; // Webhook belum diisi atau tidak valid
      }

      try {
        // Kirim menggunakan mode no-cors agar tidak terhalang kebijakan browser
        fetch(webhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(logItem),
        }).catch((err) => {
          console.warn("Pengiriman log ke webhook Google Sheet gagal:", err);
        });
      } catch (err) {
        console.warn("Error saat memicu fetch webhook:", err);
      }
    },
  };

  // Inisialisasi otomatis saat script dimuat
  Tracker.init();
  window.VisitorTracker = Tracker;
})(window);
