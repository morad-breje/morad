/* ═══════════════════════════════════
   ORDER.JS — checkout page
   ═══════════════════════════════════ */
let orderType = 'pickup';

document.addEventListener('DOMContentLoaded', () => {
  renderOrderPage();
});

function renderOrderPage() {
  const items = Cart.get();
  const emptyState = document.getElementById('emptyCartState');
  const formWrap   = document.getElementById('orderFormWrap');
  if (items.length === 0) {
    emptyState.style.display = 'block';
    if (formWrap) formWrap.style.display = 'none';
    return;
  }
  emptyState.style.display = 'none';
  if (formWrap) formWrap.style.display = 'block';
  renderOrderSummary(items);
  updateTotals(items);
}

function renderOrderSummary(items) {
  const container = document.getElementById('orderCartSummary');
  if (!container) return;
  container.innerHTML = '<div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--glaze);margin-bottom:12px">Your Items</div>';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'ocs-item';
    div.innerHTML = `
      <img class="ocs-img" src="${item.image_url}" alt="${item.name}"
           onerror="this.style.background='#E8834A40';this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 60 60\\'><text y=\\'50%\\' x=\\'50%\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\' font-size=\\'32\\'>🍩</text></svg>'">
      <div class="ocs-name">${item.name}</div>
      <div class="ocs-qty">× ${item.qty}</div>
      <div class="ocs-price">${(item.price * item.qty).toFixed(2)} JD</div>
    `;
    container.appendChild(div);
  });
}

function updateTotals(items) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = orderType === 'delivery' ? 1.5 : 0;
  const total    = subtotal + delivery;
  const sub = document.getElementById('oSubtotal');
  const del = document.getElementById('oDelivery');
  const tot = document.getElementById('oTotal');
  if (sub) sub.textContent = subtotal.toFixed(2) + ' JD';
  if (del) del.textContent = delivery > 0 ? delivery.toFixed(2) + ' JD' : 'Free Pickup';
  if (tot) tot.textContent = total.toFixed(2) + ' JD';
}

function setOrderType(type) {
  orderType = type;
  document.querySelectorAll('.otype-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  const addrGroup = document.getElementById('addressGroup');
  if (addrGroup) addrGroup.style.display = type === 'delivery' ? 'block' : 'none';
  updateTotals(Cart.get());
}

async function placeOrder() {
  const name  = document.getElementById('fName')?.value.trim();
  const phone = document.getElementById('fPhone')?.value.trim();
  const addr  = document.getElementById('fAddress')?.value.trim();
  const note  = document.getElementById('fNote')?.value.trim();
  if (!name)  { showToast('Please enter your name'); return; }
  if (!phone) { showToast('Please enter your phone number'); return; }
  if (orderType === 'delivery' && !addr) { showToast('Please enter delivery address'); return; }

  const items = Cart.get();
  if (items.length === 0) { showToast('Your cart is empty'); return; }

  const btn = document.getElementById('placeOrderBtn');
  btn.textContent = '🍩 Placing order...';
  btn.disabled = true;

  const payload = {
    customer_name: name,
    phone,
    address: addr || '',
    order_type: orderType,
    note: note || '',
    items: items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }))
  };

  try {
    const res  = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Order failed');

    // success!
    Cart.clear();
    showSuccessModal(data);
  } catch(e) {
    showToast('❌ ' + e.message);
    btn.textContent = '🍩 Place Order';
    btn.disabled = false;
  }
}

function showSuccessModal(data) {
  const overlay = document.getElementById('successOverlay');
  document.getElementById('successOrderId').textContent = data.order_id;
  document.getElementById('successTotal').textContent = data.total.toFixed(2) + ' JD';
  overlay.style.display = 'flex';
  spawnConfetti();
}

function spawnConfetti() {
  const colors = ['#E8834A','#F2A7C3','#B8E04A','#7E4CC6','#F5C842','#4ac8c8'];
  const container = document.getElementById('confetti');
  if (!container) return;
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `
      background:${colors[i % colors.length]};
      left:${Math.random() * 100}%;
      top:${-10 + Math.random() * -30}px;
      transform:rotate(${Math.random()*360}deg);
      animation-delay:${Math.random() * .8}s;
      animation-duration:${1 + Math.random()}s;
    `;
    container.appendChild(p);
    setTimeout(() => p.remove(), 2500);
  }
}
