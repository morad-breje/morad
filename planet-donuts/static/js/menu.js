/* ═══════════════════════════════════
   MENU.JS — menu page
   ═══════════════════════════════════ */
let allItems   = [];
let activeFilter = 'all';
let modalItem  = null;
let modalQty   = 1;

document.addEventListener('DOMContentLoaded', async () => {
  await loadMenu();
  setupFilters();
  setupSearch();
});

async function loadMenu() {
  const grid = document.getElementById('menuGrid');
  try {
    const res = await fetch('/api/menu');
    allItems  = await res.json();
    renderMenu(allItems);
  } catch(e) {
    grid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;padding:40px;text-align:center">Failed to load menu. Is the server running?</p>';
  }
}

function renderMenu(items) {
  const grid  = document.getElementById('menuGrid');
  const noRes = document.getElementById('noResults');
  grid.innerHTML = '';
  if (items.length === 0) {
    noRes.classList.remove('hidden');
    return;
  }
  noRes.classList.add('hidden');
  items.forEach((item, i) => {
    const badgeClass = { signature:'sig', seasonal:'sea', fun:'fun' }[item.category] || '';
    const badgeLabel = item.category.charAt(0).toUpperCase() + item.category.slice(1);
    const card = document.createElement('div');
    card.className = 'menu-card reveal';
    card.style.transitionDelay = (i % 3) * 0.07 + 's';
    card.innerHTML = `
      <div class="menu-card-img-wrap">
        <img class="menu-card-img" src="${item.image_url}" alt="${item.name}" loading="lazy"
             onerror="this.parentElement.style.background='${item.glaze_color}30';this.style.display='none'">
        <div class="menu-card-badge ${badgeClass}">${badgeLabel}</div>
      </div>
      <div class="menu-card-body">
        <div class="menu-card-name">${item.name}</div>
        <div class="menu-card-desc">${item.description}</div>
        <div class="menu-card-footer">
          <div class="menu-card-price">${item.price.toFixed(2)} JD</div>
          <div class="menu-card-actions">
            <button class="view-btn" onclick="openModal(${item.id})">Details</button>
            <button class="add-btn" onclick="quickAdd(${item.id});event.stopPropagation()">+ Cart</button>
          </div>
        </div>
      </div>`;
    card.addEventListener('click', () => openModal(item.id));
    grid.appendChild(card);
  });
  // re-trigger reveals
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      const obs = new IntersectionObserver(en => en.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.disconnect(); }
      }), { threshold: 0.05 });
      obs.observe(el);
    });
  }, 50);
}

function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.cat;
      applyFilters();
    });
  });
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(applyFilters, 200);
  });
}

function applyFilters() {
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
  let items = allItems;
  if (activeFilter !== 'all') items = items.filter(i => i.category === activeFilter);
  if (query) items = items.filter(i =>
    i.name.toLowerCase().includes(query) ||
    i.description.toLowerCase().includes(query)
  );
  renderMenu(items);
}

function quickAdd(id) {
  const item = allItems.find(i => i.id === id);
  if (item) Cart.add({ id: item.id, name: item.name, price: item.price, image_url: item.image_url });
}

// ── MODAL ────────────────────────────────────────────────────
function openModal(id) {
  const item = allItems.find(i => i.id === id);
  if (!item) return;
  modalItem = item; modalQty = 1;
  document.getElementById('modalImg').src = item.image_url;
  document.getElementById('modalBadge').textContent = item.category;
  document.getElementById('modalName').textContent  = item.name;
  document.getElementById('modalDesc').textContent  = item.description;
  document.getElementById('modalPrice').textContent = item.price.toFixed(2) + ' JD';
  document.getElementById('modalQty').textContent   = 1;
  updateModalBtn();
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.add('open');
  overlay.style.display = 'flex';
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('open');
  overlay.style.display = 'none';
}

function changeModalQty(delta) {
  modalQty = Math.max(1, modalQty + delta);
  document.getElementById('modalQty').textContent = modalQty;
  updateModalBtn();
}

function updateModalBtn() {
  if (!modalItem) return;
  const btn = document.getElementById('modalAddBtn');
  if (btn) btn.textContent = `Add ${modalQty} to Cart — ${(modalItem.price * modalQty).toFixed(2)} JD`;
}

function addModalToCart() {
  if (!modalItem) return;
  Cart.add({ id: modalItem.id, name: modalItem.name, price: modalItem.price, image_url: modalItem.image_url, qty: modalQty });
  closeModal();
  openCart();
}
