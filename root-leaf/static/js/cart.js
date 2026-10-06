/* ═══════════════════════════════════════════════════════════════════════
   ROOT & LEAF — cart.js
   Cart state management using localStorage.
   Exposes window.RL namespace for all pages to use.
═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const CART_KEY = "rl_cart";
  const FAV_KEY  = "rl_favourites";

  /* ─── Toast ─────────────────────────────────────────────────────── */
  function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const icons = { success: "🌿", error: "✕", info: "✦" };
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${icons[type] || "✦"}</span>
      <span class="toast__msg">${message}</span>
      <button class="toast__close" aria-label="Close">✕</button>
    `;

    container.appendChild(toast);

    toast.querySelector(".toast__close").addEventListener("click", () => removeToast(toast));

    // Auto-remove after 3.5s
    const timer = setTimeout(() => removeToast(toast), 3500);
    toast._timer = timer;
  }

  function removeToast(toast) {
    clearTimeout(toast._timer);
    toast.classList.add("toast--out");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }

  /* ─── Cart Storage ───────────────────────────────────────────────── */
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
    dispatchCartEvent();
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartUI();
    dispatchCartEvent();
  }

  function dispatchCartEvent() {
    document.dispatchEvent(new CustomEvent("rl:cart-updated"));
  }

  /* ─── Cart Mutations ─────────────────────────────────────────────── */
  function addToCart(plant, quantity = 1) {
    const cart = getCart();
    const idx  = cart.findIndex(i => i.id === plant.id);
    if (idx >= 0) {
      cart[idx].quantity += quantity;
    } else {
      cart.push({
        id:        plant.id,
        name:      plant.name,
        price:     plant.price,
        image_url: plant.image_url,
        quantity,
      });
    }
    saveCart(cart);
    showToast(`${plant.name} added to cart.`, "success");
    animateCartBtn();
  }

  function removeFromCart(plantId) {
    const cart = getCart().filter(i => i.id !== plantId);
    saveCart(cart);
  }

  function updateQuantity(plantId, delta) {
    const cart = getCart();
    const idx  = cart.findIndex(i => i.id === plantId);
    if (idx < 0) return;
    cart[idx].quantity = Math.max(1, cart[idx].quantity + delta);
    saveCart(cart);
  }

  function getCartTotal() {
    return getCart().reduce((s, i) => s + i.price * i.quantity, 0);
  }

  function getCartCount() {
    return getCart().reduce((s, i) => s + i.quantity, 0);
  }

  /* ─── Favourites ─────────────────────────────────────────────────── */
  function getFavourites() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
  }
  function toggleFavourite(plantId) {
    const favs = getFavourites();
    const idx  = favs.indexOf(plantId);
    if (idx >= 0) { favs.splice(idx, 1); }
    else          { favs.push(plantId); }
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    return idx < 0; // returns true if now favourited
  }
  function isFavourite(plantId) {
    return getFavourites().includes(plantId);
  }

  /* ─── Cart UI ────────────────────────────────────────────────────── */
  function renderCartItems() {
    const cart         = getCart();
    const cartItemsEl  = document.getElementById("cartItems");
    const cartEmptyEl  = document.getElementById("cartEmpty");
    const cartFooterEl = document.getElementById("cartFooter");
    const cartSubtotal = document.getElementById("cartSubtotal");

    if (!cartItemsEl) return;

    // Clear existing items (keep empty state element)
    Array.from(cartItemsEl.children).forEach(child => {
      if (child.id !== "cartEmpty") child.remove();
    });

    if (cart.length === 0) {
      if (cartEmptyEl) cartEmptyEl.style.display = "flex";
      if (cartFooterEl) cartFooterEl.style.display = "none";
      return;
    }

    if (cartEmptyEl) cartEmptyEl.style.display = "none";
    if (cartFooterEl) cartFooterEl.style.display = "block";

    cart.forEach(item => {
      const el = document.createElement("div");
      el.className = "cart-item";
      el.dataset.id = item.id;
      el.innerHTML = `
        <img src="${item.image_url}" alt="${item.name}" class="cart-item__img" loading="lazy"/>
        <div>
          <div class="cart-item__name">${item.name}</div>
          <div class="cart-item__price">£${(item.price * item.quantity).toFixed(2)}</div>
        </div>
        <div class="cart-item__controls">
          <div class="cart-item__qty">
            <button class="cart-item__qty-btn" data-action="dec" aria-label="Decrease">−</button>
            <span class="cart-item__qty-val">${item.quantity}</span>
            <button class="cart-item__qty-btn" data-action="inc" aria-label="Increase">+</button>
          </div>
          <button class="cart-item__remove" data-action="remove">Remove</button>
        </div>
      `;
      cartItemsEl.insertBefore(el, cartEmptyEl);

      // Attach events
      el.querySelector('[data-action="dec"]').addEventListener("click", () => { updateQuantity(item.id, -1); });
      el.querySelector('[data-action="inc"]').addEventListener("click", () => { updateQuantity(item.id, 1); });
      el.querySelector('[data-action="remove"]').addEventListener("click", () => {
        el.style.opacity = "0";
        el.style.transform = "translateX(20px)";
        el.style.transition = ".3s ease";
        setTimeout(() => removeFromCart(item.id), 300);
      });
    });

    if (cartSubtotal) {
      cartSubtotal.textContent = `£${getCartTotal().toFixed(2)}`;
    }
  }

  function updateCartCount() {
    const count = getCartCount();
    document.querySelectorAll(".nav__cart-count, #cartCount").forEach(el => {
      el.textContent = count;
      el.classList.toggle("visible", count > 0);
    });
  }

  function updateCartUI() {
    updateCartCount();
    renderCartItems();
  }

  function animateCartBtn() {
    const btn = document.getElementById("cartToggle");
    if (!btn) return;
    btn.style.transform = "scale(1.25)";
    btn.style.transition = ".2s cubic-bezier(.34,1.56,.64,1)";
    setTimeout(() => { btn.style.transform = ""; }, 220);
  }

  /* ─── Cart Sidebar Toggle ────────────────────────────────────────── */
  function openCart() {
    const sidebar = document.getElementById("cartSidebar");
    const overlay = document.getElementById("cartOverlay");
    if (sidebar) sidebar.classList.add("open");
    if (overlay) overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeCart() {
    const sidebar = document.getElementById("cartSidebar");
    const overlay = document.getElementById("cartOverlay");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  /* ─── Bind UI Events ─────────────────────────────────────────────── */
  function bindCartEvents() {
    const cartToggle = document.getElementById("cartToggle");
    const cartClose  = document.getElementById("cartClose");
    const cartOverlay= document.getElementById("cartOverlay");

    if (cartToggle) cartToggle.addEventListener("click", openCart);
    if (cartClose)  cartClose.addEventListener("click", closeCart);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

    // Keyboard close
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closeCart();
    });
  }

  /* ─── Public API ─────────────────────────────────────────────────── */
  window.RL = {
    getCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getFavourites,
    toggleFavourite,
    isFavourite,
    showToast,
    openCart,
    closeCart,
  };

  /* ─── Init ───────────────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", () => {
    bindCartEvents();
    updateCartUI();
  });
  // Also update when cart data changes across tabs
  window.addEventListener("storage", e => {
    if (e.key === CART_KEY) updateCartUI();
  });
})();
