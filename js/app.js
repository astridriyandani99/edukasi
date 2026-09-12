/**
 * Aplikasi Utama Katalog Leaflet
 * Menangani render UI, interaksi pencarian, filter kategori, dan modal PDF.
 */
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Inisialisasi Analytics
  window.Analytics.init();

  // 2. State Aplikasi
  const state = {
    searchQuery: "",
    selectedCategory: "all",
    sortBy: "az",
    activeLeaflet: null,
    searchDebounceTimer: null,
    searchTrackTimer: null,
  };

  // 3. Referensi Elemen DOM
  const dom = {
    searchInput: document.getElementById("search-input"),
    searchClearBtn: document.getElementById("search-clear-btn"),
    sortSelect: document.getElementById("sort-select"),
    categoryPills: document.getElementById("category-pills"),
    leafletsGrid: document.getElementById("leaflets-grid"),
    resultsCount: document.getElementById("results-count"),
    emptyState: document.getElementById("empty-state"),
    emptyQueryText: document.getElementById("empty-query-text"),
    emptyResetBtn: document.getElementById("empty-reset-btn"),
    statTotalLeaflets: document.getElementById("stat-total-leaflets"),
    statTotalCategories: document.getElementById("stat-total-categories"),
    statDataSource: document.getElementById("stat-data-source"),
    
    // Modal
    modalOverlay: document.getElementById("modal-overlay"),
    modalCloseBtn: document.getElementById("modal-close-btn"),
    modalTitle: document.getElementById("modal-title"),
    modalCategory: document.getElementById("modal-category"),
    modalIframe: document.getElementById("modal-iframe"),
    modalLoader: document.getElementById("modal-loader"),
    modalDownloadBtn: document.getElementById("modal-download-btn"),
    modalDriveBtn: document.getElementById("modal-drive-btn"),
    modalShareBtn: document.getElementById("modal-share-btn"),
    
    // Toast
    toast: document.getElementById("toast-notice"),
    toastMessage: document.getElementById("toast-message"),
    
    // Folder Button
    headerFolderBtn: document.getElementById("header-folder-btn"),
    heroFolderBtn: document.getElementById("hero-folder-btn"),
  };

  // 4. Menampilkan Skeletons saat memuat data
  showLoadingSkeletons();

  // 5. Muat Data
  const loadResult = await window.LeafletData.load();

  // 6. Update Statistik Header
  if (dom.statTotalLeaflets) {
    dom.statTotalLeaflets.textContent = window.LeafletData.items.length;
  }
  if (dom.statTotalCategories) {
    dom.statTotalCategories.textContent = window.LeafletData.categories.length;
  }
  if (dom.statDataSource) {
    dom.statDataSource.textContent = loadResult.source;
  }

  // 7. Render Kategori & Konten
  renderCategoryPills();
  updateLeafletsView();

  // 8. Setup Event Listeners
  setupEventListeners();

  /* ========================================================================
     Fungsi Render UI
     ======================================================================== */

  function renderCategoryPills() {
    if (!dom.categoryPills) return;

    const categories = window.LeafletData.categories;
    const totalAll = window.LeafletData.items.length;

    let html = `
      <button class="filter-pill ${state.selectedCategory === "all" ? "active" : ""}" data-category="all">
        Semua Topik <span class="badge-count">${totalAll}</span>
      </button>
    `;

    categories.forEach((cat) => {
      const isActive = state.selectedCategory.toLowerCase() === cat.name.toLowerCase();
      html += `
        <button class="filter-pill ${isActive ? "active" : ""}" data-category="${cat.name}">
          ${escapeHtml(cat.name)} <span class="badge-count">${cat.count}</span>
        </button>
      `;
    });

    dom.categoryPills.innerHTML = html;

    // Tambahkan event listener untuk pill
    dom.categoryPills.querySelectorAll(".filter-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        const cat = pill.getAttribute("data-category");
        if (state.selectedCategory !== cat) {
          state.selectedCategory = cat;
          renderCategoryPills();
          updateLeafletsView();
          window.Analytics.trackCategoryFilter(cat);
        }
      });
    });
  }

  function updateLeafletsView() {
    const results = window.LeafletData.query({
      search: state.searchQuery,
      category: state.selectedCategory,
      sort: state.sortBy,
    });

    // Update Counter Hasil
    if (dom.resultsCount) {
      dom.resultsCount.textContent = `Menampilkan ${results.length} dari ${window.LeafletData.items.length} leaflet`;
    }

    if (results.length === 0) {
      dom.leafletsGrid.style.display = "none";
      dom.emptyState.style.display = "block";
      if (dom.emptyQueryText) {
        dom.emptyQueryText.textContent = state.searchQuery
          ? `dengan kata kunci "${state.searchQuery}"`
          : `pada kategori "${state.selectedCategory}"`;
      }
    } else {
      dom.leafletsGrid.style.display = "grid";
      dom.emptyState.style.display = "none";
      renderLeafletCards(results);
    }
  }

  function renderLeafletCards(leaflets) {
    if (!dom.leafletsGrid) return;

    let html = "";
    leaflets.forEach((item) => {
      html += `
        <article class="leaflet-card" data-id="${item.id}">
          <div class="card-thumb-wrap" role="button" aria-label="Pratinjau ${escapeHtml(item.title)}">
            <span class="category-tag" data-cat="${escapeHtml(item.category)}">${escapeHtml(item.category)}</span>
            <img 
              class="card-thumb-img" 
              src="${item.thumbnail_url}" 
              alt="Thumbnail ${escapeHtml(item.title)}"
              loading="lazy"
              onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80';"
            />
            <div class="card-thumb-overlay">
              <span class="thumb-preview-action">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                Baca Leaflet
              </span>
            </div>
          </div>
          
          <div class="card-body">
            ${item.code ? `<div class="card-code">${escapeHtml(item.code)}</div>` : ""}
            <h3 class="card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3>
            <p class="card-desc">${escapeHtml(item.description)}</p>
            
            <div class="card-actions">
              <button class="btn btn-card-preview" data-action="preview" data-id="${item.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                Lihat Pratinjau
              </button>
              <a href="${item.download_url}" target="_blank" rel="noopener noreferrer" class="btn btn-card-download" title="Unduh PDF" data-action="download" data-id="${item.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </a>
            </div>
          </div>
        </article>
      `;
    });

    dom.leafletsGrid.innerHTML = html;

    // Event Delegation pada Grid
    setupCardActions();
  }

  function setupCardActions() {
    dom.leafletsGrid.querySelectorAll(".leaflet-card").forEach((card) => {
      const id = card.getAttribute("data-id");
      const leaflet = window.LeafletData.items.find((l) => l.id === id);
      if (!leaflet) return;

      // Klik Thumbnail -> Buka Modal
      const thumb = card.querySelector(".card-thumb-wrap");
      if (thumb) {
        thumb.addEventListener("click", () => openPreviewModal(leaflet));
      }

      // Klik Judul -> Buka Modal
      const title = card.querySelector(".card-title");
      if (title) {
        title.addEventListener("click", () => openPreviewModal(leaflet));
      }

      // Tombol Preview
      const previewBtn = card.querySelector('[data-action="preview"]');
      if (previewBtn) {
        previewBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          openPreviewModal(leaflet);
        });
      }

      // Tombol Download
      const downloadBtn = card.querySelector('[data-action="download"]');
      if (downloadBtn) {
        downloadBtn.addEventListener("click", (e) => {
          window.Analytics.trackLeafletDownload(leaflet);
          showToast(`Mengunduh: ${leaflet.title}`);
        });
      }
    });
  }

  function showLoadingSkeletons() {
    if (!dom.leafletsGrid) return;
    let html = "";
    for (let i = 0; i < 8; i++) {
      html += `
        <div class="skeleton-card">
          <div class="skeleton-thumb"></div>
          <div class="skeleton-content">
            <div class="skeleton-line w-40"></div>
            <div class="skeleton-line w-80"></div>
            <div class="skeleton-line w-60"></div>
          </div>
        </div>
      `;
    }
    dom.leafletsGrid.innerHTML = html;
  }

  /* ========================================================================
     Modal PDF Viewer Logic
     ======================================================================== */

  function openPreviewModal(leaflet) {
    state.activeLeaflet = leaflet;

    if (dom.modalTitle) dom.modalTitle.textContent = leaflet.title;
    if (dom.modalCategory) dom.modalCategory.textContent = leaflet.category;

    if (dom.modalDownloadBtn) {
      dom.modalDownloadBtn.href = leaflet.download_url;
      dom.modalDownloadBtn.onclick = () => {
        window.Analytics.trackLeafletDownload(leaflet);
        showToast("Memulai pengunduhan file...");
      };
    }

    if (dom.modalDriveBtn) {
      dom.modalDriveBtn.href = leaflet.drive_url;
      dom.modalDriveBtn.onclick = () => {
        window.Analytics.trackLeafletOpenDrive(leaflet);
      };
    }

    // Tampilkan Loader
    if (dom.modalLoader) dom.modalLoader.style.display = "flex";

    // Set Iframe Preview
    if (dom.modalIframe) {
      dom.modalIframe.src = leaflet.preview_url;
      dom.modalIframe.onload = () => {
        if (dom.modalLoader) dom.modalLoader.style.display = "none";
      };
    }

    // Buka Modal
    dom.modalOverlay.classList.add("active");
    document.body.style.overflow = "hidden"; // Kunci scroll latar belakang

    // Lacak Event Tampilan Leaflet di GA4
    window.Analytics.trackLeafletView(leaflet);
  }

  function closePreviewModal() {
    dom.modalOverlay.classList.remove("active");
    document.body.style.overflow = "";

    // Reset iframe src untuk menghentikan pemutaran/beban memori
    if (dom.modalIframe) {
      dom.modalIframe.src = "about:blank";
    }
    state.activeLeaflet = null;
  }

  /* ========================================================================
     Toast Notification
     ======================================================================== */

  function showToast(message) {
    if (!dom.toast || !dom.toastMessage) return;
    dom.toastMessage.textContent = message;
    dom.toast.classList.add("show");
    setTimeout(() => {
      dom.toast.classList.remove("show");
    }, 3200);
  }

  /* ========================================================================
     Event Listeners Setup
     ======================================================================== */

  function setupEventListeners() {
    // 1. Input Pencarian Real-Time
    if (dom.searchInput) {
      dom.searchInput.addEventListener("input", (e) => {
        const query = e.target.value;
        state.searchQuery = query;

        // Toggle Tombol Clear
        if (dom.searchClearBtn) {
          dom.searchClearBtn.style.display = query.length > 0 ? "flex" : "none";
        }

        // Debounce render untuk performa halus
        clearTimeout(state.searchDebounceTimer);
        state.searchDebounceTimer = setTimeout(() => {
          updateLeafletsView();
        }, 150);

        // Debounce pelacakan pencarian ke GA4 (setelah pengguna selesai mengetik 750ms)
        clearTimeout(state.searchTrackTimer);
        if (query.trim().length >= 3) {
          state.searchTrackTimer = setTimeout(() => {
            const currentResults = window.LeafletData.query({
              search: query,
              category: state.selectedCategory,
              sort: state.sortBy,
            });
            window.Analytics.trackSearch(query, currentResults.length);
          }, 750);
        }
      });
    }

    // 2. Tombol Clear Search
    if (dom.searchClearBtn) {
      dom.searchClearBtn.addEventListener("click", () => {
        dom.searchInput.value = "";
        dom.searchClearBtn.style.display = "none";
        state.searchQuery = "";
        updateLeafletsView();
        dom.searchInput.focus();
      });
    }

    // 3. Reset Filter dari Empty State
    if (dom.emptyResetBtn) {
      dom.emptyResetBtn.addEventListener("click", () => {
        dom.searchInput.value = "";
        if (dom.searchClearBtn) dom.searchClearBtn.style.display = "none";
        state.searchQuery = "";
        state.selectedCategory = "all";
        renderCategoryPills();
        updateLeafletsView();
      });
    }

    // 4. Dropdown Sorting
    if (dom.sortSelect) {
      dom.sortSelect.addEventListener("change", (e) => {
        state.sortBy = e.target.value;
        updateLeafletsView();
      });
    }

    // 5. Tutup Modal
    if (dom.modalCloseBtn) {
      dom.modalCloseBtn.addEventListener("click", closePreviewModal);
    }

    if (dom.modalOverlay) {
      dom.modalOverlay.addEventListener("click", (e) => {
        if (e.target === dom.modalOverlay) {
          closePreviewModal();
        }
      });
    }

    // Tutup Modal dengan tombol ESC
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && dom.modalOverlay.classList.contains("active")) {
        closePreviewModal();
      }
    });

    // 6. Tombol Salin Tautan di Modal
    if (dom.modalShareBtn) {
      dom.modalShareBtn.addEventListener("click", () => {
        if (!state.activeLeaflet) return;
        const shareUrl = state.activeLeaflet.drive_url;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            showToast("Tautan Google Drive berhasil disalin!");
          });
        } else {
          showToast("URL: " + shareUrl);
        }
      });
    }

    // 7. Tombol Folder Drive Utama
    const trackMainFolder = () => {
      window.Analytics.trackMainFolderClick();
    };
    if (dom.headerFolderBtn) dom.headerFolderBtn.addEventListener("click", trackMainFolder);
    if (dom.heroFolderBtn) dom.heroFolderBtn.addEventListener("click", trackMainFolder);
  }

  // Utility Escaping HTML
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
