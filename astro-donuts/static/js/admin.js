/* ═══════════════════════════════════
   ADMIN.JS — dashboard
   ═══════════════════════════════════ */
let allOrders   = [];
let currentFilter = 'all';
let currentOrderId = null;
let currentTab  = 'orders';

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadOrders();
  // auto-refresh every 30s
  setInterval(() => { if (currentTab === 'orders') loadOrders(); loadStats(); }, 30000);
});

function showTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(a => a.classList.remove('active'));
  document.getElementById('tab-' + tab)?.classList.add('active');
  // highlight nav
  document.querySelectorAll('.admin-nav-item').forEach(a => {
    if (a.textContent.toLowerCase().includes(tab)) a.classList.add('active');
  });
  const titles = { orders: ['Orders','Manage incoming orders'], menu: ['Menu','View menu items'], stats: ['Statistics','Business overview'] };
  const [title, sub] = titles[tab] || ['',''];
  document.getElementById('adminPageTitle').textContent = title;
  document.getElementById('adminPageSub').textContent   = sub;
  if (tab === 'menu') loadAdminMenu();
  if (tab === 'stats') loadStatsDetail();
}

function refreshCurrent() {
  loadStats();
  if (currentTab === 'orders') loadOrders();
  if (currentTab === 'menu')   loadAdminMenu();
  if (currentTab === 'stats')  loadStatsDetail();
}

// ── STATS ────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res  = await fetch('/api/admin/stats');
    const data = await res.json();
    document.getElementById('scTotal').textContent   = data.total_orders;
    document.getElementById('scToday').textContent   = data.today;
    document.getElementById('scPending').textContent = data.pending;
    document.getElementById('scRevenue').textContent = data.total_revenue.toFixed(2);
  } catch(e) { console.error('Stats error', e); }
}

async function loadStatsDetail() {
  const container = document.getElementById('statsDetail');
  try {
    const res  = await fetch('/api/admin/stats');
    const data = await res.json();
    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;max-width:600px">
        <div class="stat-card" style="padding:32px">
          <div class="sc-val" style="font-size:56px">${data.total_orders}</div>
          <div class="sc-lbl">Total Orders All Time</div>
        </div>
        <div class="stat-card" style="padding:32px">
          <div class="sc-val" style="font-size:56px">${data.total_revenue.toFixed(2)}</div>
          <div class="sc-lbl">Total Revenue (JD)</div>
        </div>
        <div class="stat-card" style="padding:32px">
          <div class="sc-val" style="font-size:56px">${data.today}</div>
          <div class="sc-lbl">Orders Today</div>
        </div>
        <div class="stat-card" style="padding:32px">
          <div class="sc-val" style="font-size:56px">${data.pending}</div>
          <div class="sc-lbl">Pending Orders</div>
        </div>
      </div>`;
  } catch(e) {
    container.innerHTML = '<div class="loading-state">Failed to load stats</div>';
  }
}

// ── ORDERS ───────────────────────────────────────────────────
async function loadOrders() {
  const list = document.getElementById('ordersList');
  try {
    const res  = await fetch('/api/admin/orders');
    allOrders  = await res.json();
    renderOrders();
  } catch(e) {
    list.innerHTML = '<div class="loading-state">Failed to load orders. Is the server running?</div>';
  }
}

function filterOrders(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderOrders();
}

function renderOrders() {
  const list = document.getElementById('ordersList');
  const items = currentFilter === 'all' ? allOrders : allOrders.filter(o => o.status === currentFilter);
  if (items.length === 0) {
    list.innerHTML = `<div class="loading-state">No ${currentFilter === 'all' ? '' : currentFilter + ' '}orders yet.</div>`;
    return;
  }
  list.innerHTML = '';
  items.forEach(order => {
    const row = document.createElement('div');
    row.className = 'order-row';
    const itemsSummary = order.items.map(i => `${i.name} ×${i.qty}`).join(', ');
    const time = new Date(order.created_at).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    row.innerHTML = `
      <div class="or-id">#${order.id}</div>
      <div>
        <div class="or-customer">${order.customer_name}</div>
        <div class="or-phone">${order.phone} · ${order.order_type === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'}</div>
      </div>
      <div class="or-items" title="${itemsSummary}">${itemsSummary.length > 50 ? itemsSummary.slice(0,50) + '…' : itemsSummary}</div>
      <div class="or-total">${order.total.toFixed(2)} JD</div>
      <div>
        <span class="status-badge status-${order.status}">${statusEmoji(order.status)} ${order.status}</span>
        <div class="or-time">${time}</div>
      </div>`;
    row.addEventListener('click', () => openOrderModal(order));
    list.appendChild(row);
  });
}

function statusEmoji(s) {
  return { pending:'⏳', confirmed:'✅', preparing:'👨‍🍳', ready:'📦', delivered:'🎉', cancelled:'✕' }[s] || '';
}

function openOrderModal(order) {
  currentOrderId = order.id;
  document.getElementById('odmId').textContent      = '#' + order.id;
  document.getElementById('odmName').textContent    = order.customer_name;
  document.getElementById('odmPhone').textContent   = order.phone;
  document.getElementById('odmType').textContent    = order.order_type === 'delivery' ? '🛵 Delivery' : '🏪 Pickup';
  document.getElementById('odmAddress').textContent = order.address || '—';
  document.getElementById('odmNote').textContent    = order.note || '—';
  document.getElementById('odmTime').textContent    = new Date(order.created_at).toLocaleString();

  const itemsEl = document.getElementById('odmItems');
  itemsEl.innerHTML = '';
  order.items.forEach(i => {
    const div = document.createElement('div');
    div.className = 'odm-item';
    div.innerHTML = `<span class="odm-item-name">${i.name}</span><span class="odm-item-qty">×${i.qty}</span><span class="odm-item-price">${(i.price * i.qty).toFixed(2)} JD</span>`;
    itemsEl.appendChild(div);
  });
  document.getElementById('odmTotal').innerHTML = `Total: <strong>${order.total.toFixed(2)} JD</strong>`;

  const overlay = document.getElementById('orderModalOverlay');
  overlay.style.display = 'flex';
}

function closeOrderModal() {
  document.getElementById('orderModalOverlay').style.display = 'none';
  currentOrderId = null;
}

async function updateStatus(status) {
  if (!currentOrderId) return;
  try {
    await fetch(`/api/admin/orders/${currentOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    closeOrderModal();
    await loadOrders();
    await loadStats();
  } catch(e) { alert('Failed to update status'); }
}

// ── ADMIN MENU ───────────────────────────────────────────────
async function loadAdminMenu() {
  const grid = document.getElementById('adminMenuGrid');
  try {
    const res  = await fetch('/api/menu');
    const data = await res.json();
    grid.innerHTML = '';
    data.forEach(item => {
      const card = document.createElement('div');
      card.className = 'admin-menu-card';
      card.innerHTML = `
        <img class="amc-img" src="${item.image_url}" alt="${item.name}"
             onerror="this.style.background='${item.glaze_color}30';this.style.height='140px';this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 220 140\\'><text y=\\'50%\\' x=\\'50%\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\' font-size=\\'60\\'>🍩</text></svg>'">
        <div class="amc-body">
          <div class="amc-name">${item.name}</div>
          <div class="amc-price">${item.price.toFixed(2)} JD</div>
          <div class="amc-cat">${item.category}</div>
        </div>`;
      grid.appendChild(card);
    });
  } catch(e) {
    grid.innerHTML = '<div class="loading-state">Failed to load menu</div>';
  }
}
