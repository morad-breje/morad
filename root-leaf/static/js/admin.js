/* ═══════════════════════════════════════════════════════════════════════
   ROOT & LEAF — admin.js
   Admin dashboard: tabs, stats, orders, inventory, statistics.
═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ─── Tab System ─────────────────────────────────────────────────── */
  const navItems = document.querySelectorAll(".admin-nav__item");
  const tabs     = document.querySelectorAll(".admin-tab");
  const titleEl  = document.getElementById("adminPageTitle");

  function switchTab(tabId) {
    tabs.forEach(t => t.classList.toggle("admin-tab--active", t.id === `tab-${tabId}`));
    navItems.forEach(n => n.classList.toggle("admin-nav__item--active", n.dataset.tab === tabId));
    if (titleEl) {
      titleEl.textContent = {
        dashboard:  "Dashboard",
        orders:     "Orders",
        inventory:  "Inventory",
        statistics: "Statistics",
      }[tabId] || "Admin";
    }
    if (tabId === "orders")     loadOrders();
    if (tabId === "inventory")  loadInventory();
    if (tabId === "statistics") loadStatistics();
    // Close sidebar on mobile after click
    if (window.innerWidth < 900) {
      document.getElementById("adminSidebar").classList.remove("open");
    }
  }

  navItems.forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();
      switchTab(item.dataset.tab);
    });
  });

  // "View All" quick-links in dashboard
  document.querySelectorAll("[data-tab]").forEach(btn => {
    if (!btn.closest(".admin-nav")) {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    }
  });

  /* ─── Sidebar Mobile Toggle ──────────────────────────────────────── */
  const menuBtn = document.getElementById("adminMenuBtn");
  const sidebar = document.getElementById("adminSidebar");
  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
  }

  /* ─── Date ───────────────────────────────────────────────────────── */
  const dateEl = document.getElementById("adminDate");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("en-GB", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  }

  /* ─── Refresh Button ─────────────────────────────────────────────── */
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      refreshBtn.classList.add("spinning");
      loadDashboard();
      setTimeout(() => refreshBtn.classList.remove("spinning"), 1000);
    });
  }

  /* ─── Status badge HTML ──────────────────────────────────────────── */
  function statusBadge(status) {
    return `<span class="status-badge status-badge--${status}">${status}</span>`;
  }

  /* ─── Format date ────────────────────────────────────────────────── */
  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch { return iso; }
  }

  /* ═══════════════════════════════════════════════════════════════════
     DASHBOARD
  ═══════════════════════════════════════════════════════════════════ */
  async function loadDashboard() {
    try {
      const data = await fetch("/api/admin/stats").then(r => r.json());

      // Stats
      setVal("statTotalOrders", data.total_orders ?? 0);
      setVal("statRevenue",     `£${(data.total_revenue ?? 0).toFixed(2)}`);
      setVal("statInventory",   data.total_plants ?? 0);
      setVal("statLowStock",    data.low_stock ?? 0);

      // Pending badge
      const badge = document.getElementById("navOrderBadge");
      if (badge) badge.textContent = data.pending_orders ?? 0;

      // Recent orders table
      const tbody = document.getElementById("recentOrdersBody");
      if (tbody) {
        if (!data.recent_orders || data.recent_orders.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" class="table-loading">No orders yet.</td></tr>`;
        } else {
          tbody.innerHTML = data.recent_orders.map(o => `
            <tr>
              <td>#${o.id}</td>
              <td>${escHtml(o.customer_name)}</td>
              <td>£${Number(o.total).toFixed(2)}</td>
              <td>${statusBadge(o.status)}</td>
              <td>${fmtDate(o.created_at)}</td>
            </tr>
          `).join("");
        }
      }

      // Status breakdown
      const breakdown = document.getElementById("statusBreakdown");
      if (breakdown && data.orders_by_status) {
        const maxCount = Math.max(...data.orders_by_status.map(s => s.count), 1);
        const colours = {
          pending:   "#D6B46B",
          confirmed: "#6ba3d4",
          preparing: "#B7D49B",
          ready:     "#5C9970",
          delivered: "#7ee8a2",
          cancelled: "#f08080",
        };
        breakdown.innerHTML = data.orders_by_status.map(s => `
          <div class="status-breakdown-item">
            <div class="status-breakdown-item__label">${s.status}</div>
            <div class="status-breakdown-item__count">${s.count}</div>
            <div class="status-breakdown-item__bar">
              <div class="status-breakdown-item__bar-fill"
                   style="width:${Math.round((s.count / maxCount) * 100)}%;background:${colours[s.status] || '#4A7C59'}"></div>
            </div>
          </div>
        `).join("");
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      window.RL && window.RL.showToast("Failed to load dashboard data.", "error");
    }
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ═══════════════════════════════════════════════════════════════════
     ORDERS
  ═══════════════════════════════════════════════════════════════════ */
  let allOrders      = [];
  let orderSearchVal = "";
  let orderStatusFilter = "";

  async function loadOrders() {
    const tbody = document.getElementById("ordersTableBody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="table-loading">Loading…</td></tr>`;
    try {
      const params = new URLSearchParams();
      if (orderStatusFilter) params.set("status", orderStatusFilter);
      const data = await fetch(`/api/admin/orders?${params}`).then(r => r.json());
      allOrders = data;
      renderOrders();
    } catch {
      if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="table-loading">Failed to load orders.</td></tr>`;
    }
  }

  function renderOrders() {
    const tbody = document.getElementById("ordersTableBody");
    if (!tbody) return;

    let orders = allOrders;
    if (orderSearchVal) {
      const q = orderSearchVal.toLowerCase();
      orders = orders.filter(o => o.customer_name.toLowerCase().includes(q) || String(o.id).includes(q));
    }

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="table-loading">No orders found.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td>#${o.id}</td>
        <td>${escHtml(o.customer_name)}</td>
        <td>${escHtml(o.phone)}</td>
        <td><span style="font-size:.78rem;color:var(--text-dim)">${o.delivery_type}</span></td>
        <td>${Array.isArray(o.items) ? o.items.length : 0} item(s)</td>
        <td>£${Number(o.total).toFixed(2)}</td>
        <td>${statusBadge(o.status)}</td>
        <td style="font-size:.8rem">${fmtDate(o.created_at)}</td>
        <td>
          <div class="action-cell">
            <button class="admin-btn" data-order-view="${o.id}" title="View order">Details</button>
          </div>
        </td>
      </tr>
    `).join("");

    tbody.querySelectorAll("[data-order-view]").forEach(btn => {
      btn.addEventListener("click", () => {
        const orderId = parseInt(btn.dataset.orderView);
        const order   = allOrders.find(o => o.id === orderId);
        if (order) openOrderModal(order);
      });
    });
  }

  // Status filter select
  const orderStatusSelect = document.getElementById("orderStatusFilter");
  if (orderStatusSelect) {
    orderStatusSelect.addEventListener("change", () => {
      orderStatusFilter = orderStatusSelect.value;
      loadOrders();
    });
  }

  // Search
  const orderSearchInput = document.getElementById("orderSearch");
  if (orderSearchInput) {
    orderSearchInput.addEventListener("input", () => {
      orderSearchVal = orderSearchInput.value.trim();
      renderOrders();
    });
  }

  /* ─── Order Modal ────────────────────────────────────────────────── */
  const orderModalOverlay = document.getElementById("orderModalOverlay");
  const orderModal        = document.getElementById("orderModal");
  const orderModalClose   = document.getElementById("orderModalClose");
  const orderModalTitle   = document.getElementById("orderModalTitle");
  const orderModalBody    = document.getElementById("orderModalBody");

  function openOrderModal(order) {
    if (orderModalTitle) orderModalTitle.textContent = `Order #${order.id}`;

    const itemsHtml = Array.isArray(order.items)
      ? order.items.map(i => `
          <div class="order-detail__item">
            <span>${escHtml(i.name || "Unknown")} <span class="order-detail__item-qty">× ${i.quantity || 1}</span></span>
            <span class="order-detail__item-price">£${((i.price || 0) * (i.quantity || 1)).toFixed(2)}</span>
          </div>
        `).join("")
      : "<p style='color:var(--text-dim);padding:.5rem'>No item data.</p>";

    if (orderModalBody) {
      orderModalBody.innerHTML = `
        <div class="order-detail__grid">
          <div class="order-detail__field"><label>Customer</label><span>${escHtml(order.customer_name)}</span></div>
          <div class="order-detail__field"><label>Phone</label><span>${escHtml(order.phone)}</span></div>
          <div class="order-detail__field"><label>Address</label><span>${escHtml(order.address)}</span></div>
          <div class="order-detail__field"><label>Delivery</label><span>${order.delivery_type}</span></div>
          <div class="order-detail__field"><label>Date</label><span>${fmtDate(order.created_at)}</span></div>
          <div class="order-detail__field"><label>Status</label>${statusBadge(order.status)}</div>
          ${order.note ? `<div class="order-detail__field" style="grid-column:1/-1"><label>Note</label><span>${escHtml(order.note)}</span></div>` : ""}
        </div>
        <div class="order-detail__items">${itemsHtml}</div>
        <div class="order-detail__total">
          <span>Total</span>
          <span style="color:var(--accent)">£${Number(order.total).toFixed(2)}</span>
        </div>
        <div class="order-detail__status-form">
          <label>Update Status</label>
          <select id="orderStatusUpdate" class="admin-select admin-select--full">
            <option value="pending"   ${order.status==="pending"  ?"selected":""}>Pending</option>
            <option value="confirmed" ${order.status==="confirmed"?"selected":""}>Confirmed</option>
            <option value="preparing" ${order.status==="preparing"?"selected":""}>Preparing</option>
            <option value="ready"     ${order.status==="ready"    ?"selected":""}>Ready</option>
            <option value="delivered" ${order.status==="delivered"?"selected":""}>Delivered</option>
            <option value="cancelled" ${order.status==="cancelled"?"selected":""}>Cancelled</option>
          </select>
          <button class="btn btn--primary btn--block" id="saveOrderStatus">Save Status</button>
        </div>
      `;

      document.getElementById("saveOrderStatus").addEventListener("click", async () => {
        const newStatus = document.getElementById("orderStatusUpdate").value;
        try {
          const resp = await fetch(`/api/admin/orders/${order.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
          if (!resp.ok) throw new Error("Failed");
          // update local data
          const idx = allOrders.findIndex(o => o.id === order.id);
          if (idx >= 0) allOrders[idx].status = newStatus;
          order.status = newStatus;
          window.RL && window.RL.showToast(`Order #${order.id} updated to "${newStatus}".`, "success");
          closeOrderModal();
          loadOrders();
          loadDashboard();
        } catch {
          window.RL && window.RL.showToast("Failed to update order status.", "error");
        }
      });
    }

    orderModalOverlay && orderModalOverlay.classList.add("active");
    orderModal        && orderModal.classList.add("active");
  }

  function closeOrderModal() {
    orderModalOverlay && orderModalOverlay.classList.remove("active");
    orderModal        && orderModal.classList.remove("active");
  }

  if (orderModalClose)   orderModalClose.addEventListener("click",   closeOrderModal);
  if (orderModalOverlay) orderModalOverlay.addEventListener("click", closeOrderModal);

  /* ═══════════════════════════════════════════════════════════════════
     INVENTORY
  ═══════════════════════════════════════════════════════════════════ */
  let allInventory        = [];
  let inventorySearchVal  = "";
  let inventoryCatFilter  = "";

  async function loadInventory() {
    const tbody = document.getElementById("inventoryTableBody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="table-loading">Loading…</td></tr>`;
    try {
      const data = await fetch("/api/admin/plants").then(r => r.json());
      allInventory = data;
      renderInventory();
    } catch {
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="table-loading">Failed to load inventory.</td></tr>`;
    }
  }

  function renderInventory() {
    const tbody = document.getElementById("inventoryTableBody");
    if (!tbody) return;

    let plants = allInventory;
    if (inventorySearchVal) {
      const q = inventorySearchVal.toLowerCase();
      plants = plants.filter(p => p.name.toLowerCase().includes(q) || p.scientific_name.toLowerCase().includes(q));
    }
    if (inventoryCatFilter) {
      plants = plants.filter(p => p.category.toLowerCase() === inventoryCatFilter.toLowerCase());
    }

    if (plants.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-loading">No plants found.</td></tr>`;
      return;
    }

    tbody.innerHTML = plants.map(p => {
      const stockClass = p.stock === 0 ? "out" : p.stock <= 2 ? "critical" : p.stock <= 5 ? "low" : "ok";
      const stockLabel = p.stock === 0 ? "Out of Stock" : p.stock <= 2 ? "Critical" : p.stock <= 5 ? "Low Stock" : "In Stock";
      return `
        <tr>
          <td>
            <div class="plant-thumb">
              <img src="${p.image_url}" alt="${escHtml(p.name)}" loading="lazy"/>
              <div>
                <div class="plant-thumb__name">${escHtml(p.name)}</div>
                <div class="plant-thumb__sci">${escHtml(p.scientific_name)}</div>
              </div>
            </div>
          </td>
          <td>${p.category}</td>
          <td>${p.difficulty}</td>
          <td>£${Number(p.price).toFixed(2)}</td>
          <td>${p.stock}</td>
          <td><span class="stock-badge stock-badge--${stockClass}">${stockLabel}</span></td>
          <td>
            <div class="action-cell">
              <button class="admin-btn admin-btn--primary" data-edit-plant="${p.id}">Edit</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll("[data-edit-plant]").forEach(btn => {
      btn.addEventListener("click", () => {
        const plant = allInventory.find(p => p.id === parseInt(btn.dataset.editPlant));
        if (plant) openEditPlantModal(plant);
      });
    });
  }

  const inventorySearchEl = document.getElementById("inventorySearch");
  if (inventorySearchEl) {
    inventorySearchEl.addEventListener("input", () => {
      inventorySearchVal = inventorySearchEl.value.trim();
      renderInventory();
    });
  }
  const inventoryCatEl = document.getElementById("inventoryCategoryFilter");
  if (inventoryCatEl) {
    inventoryCatEl.addEventListener("change", () => {
      inventoryCatFilter = inventoryCatEl.value;
      renderInventory();
    });
  }

  /* ─── Edit Plant Modal ───────────────────────────────────────────── */
  const editPlantOverlay   = document.getElementById("editPlantOverlay");
  const editPlantModal     = document.getElementById("editPlantModal");
  const editPlantClose     = document.getElementById("editPlantClose");
  const saveEditPlantBtn   = document.getElementById("saveEditPlantBtn");
  const editPlantImgPrev   = document.getElementById("editPlantImagePreview");
  const editPlantImgFile   = document.getElementById("editPlantImageFile");
  let currentEditPlantId   = null;

  function openEditPlantModal(plant) {
    currentEditPlantId = plant.id;
    document.getElementById("editPlantId").value       = plant.id;
    document.getElementById("editPlantName").value     = plant.name;
    document.getElementById("editPlantPrice").value    = plant.price;
    document.getElementById("editPlantStock").value    = plant.stock;
    document.getElementById("editPlantDesc").value     = plant.description;
    const catSel = document.getElementById("editPlantCategory");
    if (catSel) catSel.value = plant.category;
    const diffSel = document.getElementById("editPlantDifficulty");
    if (diffSel) diffSel.value = plant.difficulty;
    if (editPlantImgPrev) editPlantImgPrev.src = plant.image_url;
    if (editPlantImgFile) editPlantImgFile.value = "";

    editPlantOverlay && editPlantOverlay.classList.add("active");
    editPlantModal   && editPlantModal.classList.add("active");
  }

  function closeEditPlantModal() {
    editPlantOverlay && editPlantOverlay.classList.remove("active");
    editPlantModal   && editPlantModal.classList.remove("active");
    currentEditPlantId = null;
  }

  if (editPlantClose)   editPlantClose.addEventListener("click",   closeEditPlantModal);
  if (editPlantOverlay) editPlantOverlay.addEventListener("click", closeEditPlantModal);

  /* ─── Image upload: instant preview + upload on selection ──────────── */
  if (editPlantImgFile) {
    editPlantImgFile.addEventListener("change", async () => {
      const file = editPlantImgFile.files[0];
      if (!file || !currentEditPlantId) return;

      const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        window.RL && window.RL.showToast("Please choose a PNG, JPG, WEBP, or GIF image.", "error");
        editPlantImgFile.value = "";
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        window.RL && window.RL.showToast("Image must be under 8MB.", "error");
        editPlantImgFile.value = "";
        return;
      }

      // Instant local preview while uploading
      const localPreviewUrl = URL.createObjectURL(file);
      if (editPlantImgPrev) {
        editPlantImgPrev.src = localPreviewUrl;
        editPlantImgPrev.classList.add("edit-plant-photo__preview--uploading");
      }

      const formData = new FormData();
      formData.append("image", file);

      try {
        const resp = await fetch(`/api/admin/plants/${currentEditPlantId}/image`, {
          method: "POST",
          body: formData,
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || "Upload failed");
        }
        const updated = await resp.json();
        const idx = allInventory.findIndex(p => p.id === updated.id);
        if (idx >= 0) allInventory[idx] = updated;
        if (editPlantImgPrev) editPlantImgPrev.src = updated.image_url;
        renderInventory();
        window.RL && window.RL.showToast(`Photo updated for ${updated.name}.`, "success");
      } catch (err) {
        if (editPlantImgPrev) editPlantImgPrev.src = editPlantImgPrev.dataset.fallback || editPlantImgPrev.src;
        window.RL && window.RL.showToast(err.message || "Failed to upload image.", "error");
      } finally {
        if (editPlantImgPrev) editPlantImgPrev.classList.remove("edit-plant-photo__preview--uploading");
        URL.revokeObjectURL(localPreviewUrl);
      }
    });
  }

  if (saveEditPlantBtn) {
    saveEditPlantBtn.addEventListener("click", async () => {
      const id = document.getElementById("editPlantId").value;
      const payload = {
        name:       document.getElementById("editPlantName").value.trim(),
        price:      parseFloat(document.getElementById("editPlantPrice").value),
        stock:      parseInt(document.getElementById("editPlantStock").value),
        description:document.getElementById("editPlantDesc").value.trim(),
        category:   document.getElementById("editPlantCategory").value,
        difficulty: document.getElementById("editPlantDifficulty").value,
      };

      if (!payload.name || isNaN(payload.price) || isNaN(payload.stock)) {
        window.RL && window.RL.showToast("Please fill in all required fields.", "error");
        return;
      }

      try {
        const resp = await fetch(`/api/admin/plants/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) throw new Error("Failed");
        const updated = await resp.json();
        const idx = allInventory.findIndex(p => p.id === updated.id);
        if (idx >= 0) allInventory[idx] = updated;
        renderInventory();
        closeEditPlantModal();
        window.RL && window.RL.showToast(`${updated.name} updated successfully.`, "success");
      } catch {
        window.RL && window.RL.showToast("Failed to update plant.", "error");
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     STATISTICS
  ═══════════════════════════════════════════════════════════════════ */
  async function loadStatistics() {
    try {
      const [stats, plants] = await Promise.all([
        fetch("/api/admin/stats").then(r => r.json()),
        fetch("/api/admin/plants").then(r => r.json()),
      ]);

      // Bar chart: orders by status
      const chartContainer = document.getElementById("statusChartContainer");
      if (chartContainer && stats.orders_by_status) {
        const max = Math.max(...stats.orders_by_status.map(s => s.count), 1);
        const colours = {
          pending:"#D6B46B", confirmed:"#6ba3d4", preparing:"#B7D49B",
          ready:"#5C9970", delivered:"#7ee8a2", cancelled:"#f08080",
        };
        chartContainer.innerHTML = stats.orders_by_status.map(s => `
          <div class="chart-bar-row">
            <span class="chart-bar-label">${s.status}</span>
            <div class="chart-bar-track">
              <div class="chart-bar-fill" data-width="${Math.round((s.count/max)*100)}"
                   style="width:0%;background:${colours[s.status]||'#4A7C59'}"></div>
            </div>
            <span class="chart-bar-val">${s.count}</span>
          </div>
        `).join("");
        // Animate bars
        requestAnimationFrame(() => {
          chartContainer.querySelectorAll(".chart-bar-fill").forEach(bar => {
            bar.style.width = bar.dataset.width + "%";
          });
        });
      }

      // Revenue highlights
      const revHighlights = document.getElementById("revenueHighlights");
      if (revHighlights) {
        revHighlights.innerHTML = `
          <div class="rev-row"><span class="rev-row__label">Total Revenue</span><span class="rev-row__value">£${Number(stats.total_revenue||0).toFixed(2)}</span></div>
          <div class="rev-row"><span class="rev-row__label">Total Orders</span><span class="rev-row__value">${stats.total_orders||0}</span></div>
          <div class="rev-row"><span class="rev-row__label">Pending Orders</span><span class="rev-row__value">${stats.pending_orders||0}</span></div>
          <div class="rev-row"><span class="rev-row__label">Delivered Orders</span><span class="rev-row__value">${stats.delivered_orders||0}</span></div>
          <div class="rev-row"><span class="rev-row__label">Plants Listed</span><span class="rev-row__value">${stats.total_plants||0}</span></div>
          <div class="rev-row"><span class="rev-row__label">Low Stock Plants</span><span class="rev-row__value">${stats.low_stock||0}</span></div>
        `;
      }

      // Inventory health
      const invHealth = document.getElementById("inventoryHealth");
      if (invHealth && plants.length) {
        const sorted = [...plants].sort((a, b) => a.stock - b.stock).slice(0, 12);
        const maxStock = Math.max(...plants.map(p => p.stock), 1);
        invHealth.innerHTML = sorted.map(p => {
          const cls = p.stock === 0 ? "critical" : p.stock <= 3 ? "low" : "";
          return `
            <div class="inv-health-item ${cls ? `inv-health-item--${cls}` : ""}">
              <div class="inv-health-item__name">${escHtml(p.name)}</div>
              <div class="inv-health-item__stock">${p.stock} in stock</div>
              <div class="inv-health-item__bar">
                <div class="inv-health-item__bar-fill"
                     data-width="${Math.round((p.stock / maxStock) * 100)}"
                     style="width:0%"></div>
              </div>
            </div>
          `;
        }).join("");
        requestAnimationFrame(() => {
          invHealth.querySelectorAll(".inv-health-item__bar-fill").forEach(bar => {
            bar.style.width = bar.dataset.width + "%";
          });
        });
      }
    } catch (err) {
      console.error("Statistics load error:", err);
    }
  }

  /* ─── Utility ────────────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ─── Init ───────────────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
  });
})();
