/* ═══════════════════════════════════
   CART — shared across all pages
   ═══════════════════════════════════ */
const Cart = {
  get() {
    try { return JSON.parse(localStorage.getItem('pd_cart') || '[]'); }
    catch { return []; }
  },
  save(items) {
    localStorage.setItem('pd_cart', JSON.stringify(items));
    Cart.updateUI();
  },
  add(item) {
    const items = Cart.get();
    const existing = items.find(i => i.id === item.id);
    if (existing) {
      existing.qty += (item.qty || 1);
    } else {
      items.push({ ...item, qty: item.qty || 1 });
    }
    Cart.save(items);
    showToast(`🍩 ${item.name} added to cart!`);
  },
  remove(id) {
    Cart.save(Cart.get().filter(i => i.id !== id));
  },
  updateQty(id, delta) {
    const items = Cart.get().map(i => {
      if (i.id === id) i.qty = Math.max(1, i.qty + delta);
      return i;
    });
    Cart.save(items);
  },
  clear() {
    Cart.save([]);
  },
  total() {
    return Cart.get().reduce((sum, i) => sum + i.price * i.qty, 0);
  },
  count() {
    return Cart.get().reduce((sum, i) => sum + i.qty, 0);
  },
  updateUI() {
    const count = Cart.count();
    document.querySelectorAll('#cartCount').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
    // refresh sidebar if open
    if (typeof renderCartSidebar === 'function') renderCartSidebar();
  }
};

// Cart sidebar (menu page)
function openCart() {
  document.getElementById('cartSidebar')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  renderCartSidebar();
}
function closeCart() {
  document.getElementById('cartSidebar')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
}

function renderCartSidebar() {
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  const empty = document.getElementById('cartEmpty');
  if (!container) return;
  const items = Cart.get();
  if (items.length === 0) {
    if (empty) empty.classList.remove('hidden');
    if (footer) footer.style.display = 'none';
    // remove rendered items
    container.querySelectorAll('.cart-item').forEach(el => el.remove());
    return;
  }
  if (empty) empty.classList.add('hidden');
  if (footer) {
    footer.style.display = 'block';
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = Cart.total().toFixed(2) + ' JD';
  }
  // rebuild
  container.querySelectorAll('.cart-item').forEach(el => el.remove());
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.dataset.id = item.id;
    div.innerHTML = `
      <img class="cart-item-img" src="${item.image_url || ''}" alt="${item.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\'><text y=\\'50%\\' dominant-baseline=\\'middle\\' font-size=\\'40\\'>🍩</text></svg>'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${(item.price * item.qty).toFixed(2)} JD</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="Cart.updateQty(${item.id},-1);renderCartSidebar()">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="Cart.updateQty(${item.id},1);renderCartSidebar()">+</button>
        </div>
      </div>
      <button class="cart-item-del" onclick="Cart.remove(${item.id});renderCartSidebar()" title="Remove">✕</button>
    `;
    container.appendChild(div);
  });
}

// Toast
function showToast(msg) {
  let t = document.getElementById('pd-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'pd-toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

// Init cart count on load
document.addEventListener('DOMContentLoaded', () => Cart.updateUI());
