/* ═══════════════════════════════════════════════════════════════════════
   ROOT & LEAF — plants.js
   Plants page: fetch, render, filter, sort, modal, favourites.
═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ─── HTML Escape utility ───────────────────────────────────────── */
  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ─── State ──────────────────────────────────────────────────────── */
  let allPlants       = [];
  let currentPlant    = null;
  let currentQty      = 1;
  let activeCategory  = "";
  let activeSort      = "id";
  let activeSearch    = "";
  let activeMaxPrice  = 200;
  let viewMode        = "grid";
  let searchDebounce  = null;

  /* ─── DOM Refs ───────────────────────────────────────────────────── */
  const plantsGrid     = document.getElementById("plantsGrid");
  const plantsEmpty    = document.getElementById("plantsEmpty");
  const plantCountEl   = document.getElementById("plantCount");
  const searchInput    = document.getElementById("searchInput");
  const searchClear    = document.getElementById("searchClear");
  const sortSelect     = document.getElementById("sortSelect");
  const priceRange     = document.getElementById("priceRange");
  const priceValue     = document.getElementById("priceValue");
  const categoryFilters= document.getElementById("categoryFilters");
  const gridViewBtn    = document.getElementById("gridView");
  const listViewBtn    = document.getElementById("listView");
  const resetFiltersBtn= document.getElementById("resetFilters");

  /* Modal */
  const modalOverlay  = document.getElementById("modalOverlay");
  const plantModal    = document.getElementById("plantModal");
  const modalClose    = document.getElementById("modalClose");
  const qtyUp         = document.getElementById("qtyUp");
  const qtyDown       = document.getElementById("qtyDown");
  const qtyValueEl    = document.getElementById("qtyValue");
  const modalAddBtn   = document.getElementById("modalAddToCart");
  const modalFavBtn   = document.getElementById("modalFavourite");

  /* ─── Fetch Plants ───────────────────────────────────────────────── */
  async function fetchPlants() {
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (activeSearch)   params.set("search", activeSearch);
    if (activeSort)     params.set("sort", activeSort);
    if (activeMaxPrice < 200) params.set("max_price", activeMaxPrice);

    try {
      const resp = await fetch(`/api/plants?${params}`);
      if (!resp.ok) throw new Error("Network error");
      allPlants = await resp.json();
    } catch {
      allPlants = [];
      window.RL && window.RL.showToast("Failed to load plants. Please refresh.", "error");
    }
    renderPlants();
  }

  /* ─── Render ─────────────────────────────────────────────────────── */
  function renderPlants() {
    if (!plantsGrid) return;

    if (plantCountEl) plantCountEl.textContent = allPlants.length;

    if (allPlants.length === 0) {
      plantsGrid.innerHTML = "";
      if (plantsEmpty) plantsEmpty.style.display = "flex";
      return;
    }

    if (plantsEmpty) plantsEmpty.style.display = "none";

    plantsGrid.innerHTML = allPlants.map(p => buildCard(p)).join("");

    // Bind events on new cards
    plantsGrid.querySelectorAll(".plant-card").forEach((card, idx) => {
      const plantId = parseInt(card.dataset.id);
      const plant   = allPlants.find(p => p.id === plantId);
      if (!plant) return;

      // Stagger animation
      card.style.opacity    = "0";
      card.style.transform  = "translateY(20px)";
      card.style.transition = `opacity .45s ease ${idx * 0.05}s, transform .45s ease ${idx * 0.05}s`;
      requestAnimationFrame(() => {
        card.style.opacity   = "1";
        card.style.transform = "translateY(0)";
      });

      // View Details / card click → open modal
      const detailBtn = card.querySelector("[data-detail]");
      if (detailBtn) detailBtn.addEventListener("click", e => { e.stopPropagation(); openModal(plant); });
      card.addEventListener("click", e => {
        if (e.target.closest("button")) return;
        openModal(plant);
      });

      // Favourite button
      const favBtn = card.querySelector("[data-fav]");
      if (favBtn) {
        favBtn.classList.toggle("active", window.RL ? window.RL.isFavourite(plantId) : false);
        favBtn.addEventListener("click", e => {
          e.stopPropagation();
          if (!window.RL) return;
          const now = window.RL.toggleFavourite(plantId);
          favBtn.classList.toggle("active", now);
          window.RL.showToast(now ? "Added to favourites." : "Removed from favourites.", "info");
        });
      }
    });

    // Deep-link: open modal if hash matches #plant-N
    const hash = window.location.hash;
    if (hash && hash.startsWith("#plant-")) {
      const id = parseInt(hash.replace("#plant-", ""));
      const p  = allPlants.find(pl => pl.id === id);
      if (p) openModal(p);
    }
  }

  function buildCard(p) {
    const faved = window.RL && window.RL.isFavourite(p.id);
    return `
      <div class="plant-card" data-id="${esc(p.id)}">
        <div class="plant-card__image-wrap">
          <img src="${esc(p.image_url)}" alt="${esc(p.name)}" class="plant-card__image" loading="lazy"/>
          <span class="plant-card__diff-badge plant-card__diff-badge--${esc(p.difficulty)}">${esc(p.difficulty)}</span>
          <button class="plant-card__fav${faved ? ' active' : ''}" data-fav="${esc(p.id)}" aria-label="Toggle favourite">
            <svg viewBox="0 0 24 24" fill="${faved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>
        </div>
        <div class="plant-card__body">
          <p class="plant-card__category">${esc(p.category)}</p>
          <h3 class="plant-card__name">${esc(p.name)}</h3>
          <p class="plant-card__sci">${esc(p.scientific_name)}</p>
          <div class="plant-card__footer">
            <span class="plant-card__price">£${Number(p.price).toFixed(2)}</span>
            <button class="plant-card__btn" data-detail="${esc(p.id)}">View Details</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ─── Modal ──────────────────────────────────────────────────────── */
  function openModal(plant) {
    currentPlant = plant;
    currentQty   = 1;

    // Populate — use textContent throughout to prevent XSS
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? ""; };
    document.getElementById("modalImage").src = esc(plant.image_url);
    document.getElementById("modalImage").alt = esc(plant.name);
    setTxt("modalCategory",   plant.category);
    setTxt("modalPlantName",  plant.name);
    setTxt("modalScientific", plant.scientific_name);
    setTxt("modalDesc",       plant.description);
    setTxt("modalLight",      plant.light);
    setTxt("modalWater",      plant.watering);
    setTxt("modalTemp",       plant.temperature);
    setTxt("modalHumidity",   plant.humidity);
    setTxt("modalHeight",     plant.height);
    setTxt("modalPrice",      `£${Number(plant.price).toFixed(2)}`);
    if (qtyValueEl) qtyValueEl.textContent = "1";

    // Difficulty badge
    const diffBadge = document.getElementById("modalDiffBadge");
    if (diffBadge) {
      diffBadge.textContent = plant.difficulty;
      diffBadge.style.background = plant.difficulty === "Easy"
        ? "rgba(74,124,89,.35)"
        : plant.difficulty === "Moderate"
          ? "rgba(214,180,107,.25)"
          : "rgba(200,80,80,.2)";
      diffBadge.style.color = plant.difficulty === "Easy" ? "#B7D49B" : plant.difficulty === "Moderate" ? "#D6B46B" : "#f08080";
    }

    // Pet badge
    const petBadge = document.getElementById("modalPetBadge");
    if (petBadge) {
      petBadge.textContent = plant.pet_safe ? "🐾 Pet Safe" : "⚠ Toxic to Pets";
      petBadge.className   = `modal__pet-badge modal__pet-badge--${plant.pet_safe ? "safe" : "unsafe"}`;
    }

    // Fav button state
    if (modalFavBtn) {
      const faved = window.RL && window.RL.isFavourite(plant.id);
      modalFavBtn.innerHTML = faved
        ? `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> Saved to Favourites`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> Save to Favourites`;
    }

    // Open
    modalOverlay && modalOverlay.classList.add("active");
    plantModal   && plantModal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Update hash
    history.pushState(null, "", `#plant-${plant.id}`);
  }

  function closeModal() {
    modalOverlay && modalOverlay.classList.remove("active");
    plantModal   && plantModal.classList.remove("active");
    document.body.style.overflow = "";
    history.pushState(null, "", window.location.pathname);
    currentPlant = null;
  }

  /* ─── Filters & Search ───────────────────────────────────────────── */
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      activeSearch = searchInput.value.trim();
      searchClear && searchClear.classList.toggle("visible", activeSearch.length > 0);
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(fetchPlants, 320);
    });
  }
  if (searchClear) {
    searchClear.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      activeSearch = "";
      searchClear.classList.remove("visible");
      fetchPlants();
    });
  }

  if (categoryFilters) {
    categoryFilters.querySelectorAll(".filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        categoryFilters.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("filter-chip--active"));
        chip.classList.add("filter-chip--active");
        activeCategory = chip.dataset.cat || "";
        fetchPlants();
      });
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      activeSort = sortSelect.value;
      fetchPlants();
    });
  }

  if (priceRange) {
    priceRange.addEventListener("input", () => {
      activeMaxPrice = parseInt(priceRange.value);
      if (priceValue) priceValue.textContent = activeMaxPrice;
    });
    priceRange.addEventListener("change", () => {
      activeMaxPrice = parseInt(priceRange.value);
      fetchPlants();
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      activeSearch    = "";
      activeCategory  = "";
      activeSort      = "id";
      activeMaxPrice  = 200;
      if (searchInput) searchInput.value = "";
      if (searchClear) searchClear.classList.remove("visible");
      if (sortSelect)  sortSelect.value  = "id";
      if (priceRange)  priceRange.value  = 200;
      if (priceValue)  priceValue.textContent = "200";
      categoryFilters && categoryFilters.querySelectorAll(".filter-chip").forEach(c => {
        c.classList.toggle("filter-chip--active", c.dataset.cat === "");
      });
      fetchPlants();
    });
  }

  /* ─── View Toggle ────────────────────────────────────────────────── */
  if (gridViewBtn) {
    gridViewBtn.addEventListener("click", () => {
      viewMode = "grid";
      plantsGrid && plantsGrid.classList.remove("plants-grid--list");
      gridViewBtn.classList.add("view-btn--active");
      listViewBtn && listViewBtn.classList.remove("view-btn--active");
    });
  }
  if (listViewBtn) {
    listViewBtn.addEventListener("click", () => {
      viewMode = "list";
      plantsGrid && plantsGrid.classList.add("plants-grid--list");
      listViewBtn.classList.add("view-btn--active");
      gridViewBtn && gridViewBtn.classList.remove("view-btn--active");
    });
  }

  /* ─── Modal events ───────────────────────────────────────────────── */
  if (modalClose)   modalClose.addEventListener("click", closeModal);
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && plantModal && plantModal.classList.contains("active")) closeModal(); });

  if (qtyUp) {
    qtyUp.addEventListener("click", () => {
      currentQty++;
      if (qtyValueEl) qtyValueEl.textContent = currentQty;
    });
  }
  if (qtyDown) {
    qtyDown.addEventListener("click", () => {
      if (currentQty > 1) currentQty--;
      if (qtyValueEl) qtyValueEl.textContent = currentQty;
    });
  }

  if (modalAddBtn) {
    modalAddBtn.addEventListener("click", () => {
      if (!currentPlant || !window.RL) return;
      window.RL.addToCart(currentPlant, currentQty);
      closeModal();
      window.RL.openCart();
    });
  }

  if (modalFavBtn) {
    modalFavBtn.addEventListener("click", () => {
      if (!currentPlant || !window.RL) return;
      const now = window.RL.toggleFavourite(currentPlant.id);
      window.RL.showToast(now ? "Added to favourites." : "Removed from favourites.", "info");
      modalFavBtn.innerHTML = now
        ? `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> Saved to Favourites`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> Save to Favourites`;
      // Update card fav buttons
      document.querySelectorAll(`[data-fav="${currentPlant.id}"]`).forEach(b => b.classList.toggle("active", now));
    });
  }

  /* ─── Check URL params on load ───────────────────────────────────── */
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("category")) {
    activeCategory = urlParams.get("category");
    if (categoryFilters) {
      categoryFilters.querySelectorAll(".filter-chip").forEach(c => {
        c.classList.toggle("filter-chip--active", c.dataset.cat.toLowerCase() === activeCategory.toLowerCase());
      });
    }
  }

  /* ─── Init ───────────────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", fetchPlants);
})();
