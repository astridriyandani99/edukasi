/**
 * Modul Google Analytics 4 (GA4) Tracker
 * Bertanggung jawab menginisialisasi GA4 dan melacak setiap interaksi leaflet.
 */
(function (window) {
  const Analytics = {
    isInitialized: false,
    measurementId: null,

    /**
     * Inisialisasi Google Analytics
     */
    init: function () {
      const config = window.APP_CONFIG || {};
      const gaId = config.GA_MEASUREMENT_ID;

      this.measurementId = gaId;

      // Cek apakah ID valid dan bukan placeholder
      if (gaId && gaId.startsWith("G-") && gaId !== "G-XXXXXXXXXX") {
        this.injectGtagScript(gaId);
        this.isInitialized = true;
        this.log("Google Analytics 4 berhasil diinisialisasi dengan ID:", gaId);
      } else {
        this.log(
          "Mode Simulasi/Dev: GA_MEASUREMENT_ID belum diisi atau masih placeholder. Event akan dicatat di Console Browser."
        );
      }
    },

    /**
     * Menyisipkan script Google Tag Manager ke <head>
     */
    injectGtagScript: function (gaId) {
      window.dataLayer = window.dataLayer || [];
      if (typeof window.gtag !== "function") {
        function gtag() {
          window.dataLayer.push(arguments);
        }
        window.gtag = gtag;

        gtag("js", new Date());
        gtag("config", gaId, {
          send_page_view: true,
          anonymize_ip: true,
        });
      }

      // Hindari duplikasi jika tag sudah disematkan di index.html
      const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
      if (!existingScript) {
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);
      }
    },

    /**
     * Mengirim custom event ke GA4 atau simulasi console
     */
    trackEvent: function (eventName, eventParams = {}) {
      const timestamp = new Date().toISOString();
      const enrichedParams = {
        ...eventParams,
        timestamp: timestamp,
      };

      if (this.isInitialized && typeof window.gtag === "function") {
        window.gtag("event", eventName, enrichedParams);
      }

      if (window.APP_CONFIG?.ENABLE_DEBUG_LOGS) {
        console.groupCollapsed(
          `%c📊 GA4 Event: ${eventName}`,
          "background: #0ea5e9; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;"
        );
        console.table(enrichedParams);
        console.groupEnd();
      }
    },

    /**
     * Melacak ketika leaflet dibuka untuk pratinjau (preview modal)
     */
    trackLeafletView: function (leaflet) {
      this.trackEvent("leaflet_view", {
        leaflet_id: leaflet.id,
        leaflet_title: leaflet.title,
        leaflet_category: leaflet.category || "Umum",
        leaflet_code: leaflet.code || "",
        interaction_type: "modal_preview",
      });
    },

    /**
     * Melacak ketika tombol unduh ditekan
     */
    trackLeafletDownload: function (leaflet) {
      this.trackEvent("leaflet_download", {
        leaflet_id: leaflet.id,
        leaflet_title: leaflet.title,
        leaflet_category: leaflet.category || "Umum",
        leaflet_code: leaflet.code || "",
        interaction_type: "download_pdf",
      });
    },

    /**
     * Melacak ketika pengguna mengklik link Google Drive langsung
     */
    trackLeafletOpenDrive: function (leaflet) {
      this.trackEvent("leaflet_open_drive", {
        leaflet_id: leaflet.id,
        leaflet_title: leaflet.title,
        leaflet_category: leaflet.category || "Umum",
        interaction_type: "open_google_drive",
      });
    },

    /**
     * Melacak pencarian yang dilakukan pengguna
     */
    trackSearch: function (searchTerm, resultsCount) {
      if (!searchTerm || searchTerm.trim().length === 0) return;
      this.trackEvent("leaflet_search", {
        search_term: searchTerm.trim(),
        results_count: resultsCount,
      });
    },

    /**
     * Melacak pemilihan kategori
     */
    trackCategoryFilter: function (categoryName) {
      this.trackEvent("leaflet_filter_category", {
        category_name: categoryName,
      });
    },

    /**
     * Melacak klik folder Google Drive utama di header
     */
    trackMainFolderClick: function () {
      this.trackEvent("open_main_drive_folder", {
        folder_url: window.APP_CONFIG?.DRIVE_FOLDER_URL,
      });
    },

    log: function (...args) {
      if (window.APP_CONFIG?.ENABLE_DEBUG_LOGS) {
        console.log(
          "%c[Analytics Tracker]",
          "color: #10b981; font-weight: bold;",
          ...args
        );
      }
    },
  };

  window.Analytics = Analytics;
})(window);
