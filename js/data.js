/**
 * Modul Data Leaflet
 * Mengelola pemuatan data dari Google Sheets (CSV) atau file lokal (JSON fallback).
 */
(function (window) {
  const LeafletData = {
    items: [],
    categories: [],

    /**
     * Memuat data leaflet dari Google Sheets atau data lokal
     */
    load: async function () {
      const config = window.APP_CONFIG || {};
      const sheetUrl = config.GOOGLE_SHEET_CSV_URL;

      if (sheetUrl && sheetUrl.trim() !== "") {
        try {
          console.log("Mencoba memuat data dari Google Sheets...");
          const sheetItems = await this.fetchFromGoogleSheet(sheetUrl);
          if (sheetItems && sheetItems.length > 0) {
            this.items = sheetItems;
            this.updateCategories();
            return { source: "Google Sheets", count: this.items.length };
          }
        } catch (err) {
          console.warn("Gagal memuat Google Sheet, beralih ke data lokal:", err);
        }
      }

      // Fallback: Memuat dari data/leaflets.json
      try {
        const response = await fetch("data/leaflets.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.items = await response.json();
        this.updateCategories();
        return { source: "Local JSON", count: this.items.length };
      } catch (err) {
        console.error("Gagal memuat leaflets.json:", err);
        this.items = [];
        return { source: "Error", count: 0 };
      }
    },

    /**
     * Mengambil dan mem-parsing CSV publik Google Sheets
     */
    fetchFromGoogleSheet: async function (csvUrl) {
      const resp = await fetch(csvUrl);
      if (!resp.ok) throw new Error("Gagal mengunduh CSV Google Sheets");
      const csvText = await resp.text();
      return this.parseCSV(csvText);
    },

    /**
     * Parser CSV yang aman terhadap koma dalam tanda kutip
     */
    parseCSV: function (text) {
      const lines = [];
      let row = [""];
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            row[row.length - 1] += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          row.push("");
        } else if ((char === "\r" || char === "\n") && !inQuotes) {
          if (char === "\r" && nextChar === "\n") i++;
          if (row.length > 1 || row[0] !== "") lines.push(row);
          row = [""];
        } else {
          row[row.length - 1] += char;
        }
      }
      if (row.length > 1 || row[0] !== "") lines.push(row);

      if (lines.length < 2) return [];

      // Baris pertama adalah Header
      const headers = lines[0].map((h) => h.trim().toLowerCase());

      const getColIndex = (names) => {
        for (const name of names) {
          const idx = headers.indexOf(name);
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const idIdx = getColIndex(["id", "file id", "drive id", "link"]);
      const titleIdx = getColIndex(["judul", "title", "nama leaflet", "nama"]);
      const catIdx = getColIndex(["kategori", "category", "bidang"]);
      const descIdx = getColIndex(["deskripsi", "description", "keterangan"]);
      const codeIdx = getColIndex(["kode", "code", "no"]);

      const results = [];

      for (let i = 1; i < lines.length; i++) {
        const r = lines[i];
        if (!r || r.length === 0) continue;

        let rawId = idIdx !== -1 ? (r[idIdx] || "").trim() : "";
        let title = titleIdx !== -1 ? (r[titleIdx] || "").trim() : "";
        let category = catIdx !== -1 ? (r[catIdx] || "").trim() : "Umum";
        let desc = descIdx !== -1 ? (r[descIdx] || "").trim() : "";
        let code = codeIdx !== -1 ? (r[codeIdx] || "").trim() : "";

        // Jika user memasukkan link gdrive lengkap, ekstrak file ID-nya
        let fileId = rawId;
        const idMatch = rawId.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
        if (idMatch) {
          fileId = idMatch[1];
        }

        if (!title && !fileId) continue;
        if (!title) title = `Leaflet ${fileId.substring(0, 8)}`;

        results.push(this.formatLeafletRecord(fileId, code, title, category, desc));
      }

      return results;
    },

    /**
     * Standarisasi objek Leaflet
     */
    formatLeafletRecord: function (fileId, code, title, category, desc) {
      return {
        id: fileId,
        code: code || (title.includes(" ") ? title.split(" ")[0] : ""),
        title: title,
        original_filename: `${title}.pdf`,
        category: category || "Umum",
        description: desc || "Leaflet panduan edukasi kesehatan resmi bagi pasien dan masyarakat.",
        drive_url: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
        download_url: `https://drive.google.com/uc?export=download&id=${fileId}`,
        preview_url: `https://drive.google.com/file/d/${fileId}/preview`,
        thumbnail_url: `https://lh3.googleusercontent.com/d/${fileId}=w600`,
      };
    },

    /**
     * Memperbarui daftar kategori unik beserta jumlah itemnya
     */
    updateCategories: function () {
      const counts = {};
      this.items.forEach((item) => {
        const cat = item.category || "Umum";
        counts[cat] = (counts[cat] || 0) + 1;
      });

      this.categories = Object.keys(counts).map((name) => ({
        name: name,
        count: counts[name],
      }));

      // Urutkan kategori terbanyak lebih dulu
      this.categories.sort((a, b) => b.count - a.count);
    },

    /**
     * Filter dan pencarian leaflet
     */
    query: function ({ search = "", category = "all", sort = "az" }) {
      let filtered = [...this.items];

      // 1. Filter Kategori
      if (category && category !== "all") {
        filtered = filtered.filter(
          (item) => item.category.toLowerCase() === category.toLowerCase()
        );
      }

      // 2. Filter Pencarian Teks
      if (search && search.trim() !== "") {
        const terms = search.toLowerCase().trim().split(/\s+/);
        filtered = filtered.filter((item) => {
          const content = `${item.title} ${item.code} ${item.category} ${item.description}`.toLowerCase();
          return terms.every((t) => content.includes(t));
        });
      }

      // 3. Pengurutan (Sorting)
      if (sort === "az") {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sort === "za") {
        filtered.sort((a, b) => b.title.localeCompare(a.title));
      } else if (sort === "category") {
        filtered.sort((a, b) => a.category.localeCompare(b.category));
      }

      return filtered;
    },
  };

  window.LeafletData = LeafletData;
})(window);
