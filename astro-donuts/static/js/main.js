/* ═══════════════════════════════════
   MAIN.JS — shared animations & UI
   ═══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // ── LOADER ──────────────────────────────────────────────
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => {
      loader.style.transition = 'opacity .6s ease';
      loader.style.opacity = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 650);
    }, 1700);
  }

  // ── CUSTOM CURSOR ───────────────────────────────────────
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursor-ring');
  if (cursor && ring) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
    });
    (function animRing() {
      rx += (mx - rx) * .14;
      ry += (my - ry) * .14;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(animRing);
    })();
    document.querySelectorAll('a,button,.donut-card,.menu-card,.hcard,.gallery-card').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.width  = '20px'; cursor.style.height = '20px';
        cursor.style.background = 'var(--lime)';
        ring.style.width  = '52px'; ring.style.height = '52px';
        ring.style.borderColor = 'var(--lime)';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.width  = '12px'; cursor.style.height = '12px';
        cursor.style.background = 'var(--glaze)';
        ring.style.width  = '36px'; ring.style.height = '36px';
        ring.style.borderColor = 'var(--glaze)';
      });
    });
  }

  // ── SCROLL REVEAL ───────────────────────────────────────
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  // ── NAV SCROLL ──────────────────────────────────────────
  const nav = document.getElementById('navbar');
  if (nav && !nav.classList.contains('nav-solid')) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    });
  }

  // ── HERO PARALLAX RINGS ─────────────────────────────────
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    document.querySelectorAll('.donut-ring').forEach((r, i) => {
      r.style.transform = `rotate(${y * (0.04 + i * 0.025)}deg)`;
    });
    // floating donuts parallax
    document.querySelectorAll('.float-donut').forEach((d, i) => {
      d.style.transform = `translateY(${y * (0.1 + i * 0.04)}px)`;
    });
  });

  // ── HORIZONTAL SCROLL (home gallery) ───────────────────
  const hscroll = document.querySelector('.hscroll-wrapper');
  if (hscroll) {
    let isDown = false, startX, scrollLeft;
    hscroll.addEventListener('mousedown', e => {
      isDown = true; startX = e.pageX - hscroll.offsetLeft;
      scrollLeft = hscroll.scrollLeft; hscroll.style.cursor = 'grabbing';
    });
    document.addEventListener('mouseup', () => { isDown = false; hscroll.style.cursor = 'grab'; });
    document.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - hscroll.offsetLeft;
      hscroll.scrollLeft = scrollLeft - (x - startX) * 1.4;
    });
    // load hscroll cards
    loadHScrollCards();
  }

  // ── FEATURED GRID (home) ────────────────────────────────
  if (document.getElementById('featuredGrid')) loadFeatured();

});

// ── LOAD FEATURED DONUTS (home) ─────────────────────────────
async function loadFeatured() {
  const grid = document.getElementById('featuredGrid');
  try {
    const res  = await fetch('/api/menu');
    const data = await res.json();
    // pick first 4
    const featured = data.slice(0, 4);
    grid.innerHTML = '';
    featured.forEach(item => {
      const card = document.createElement('div');
      card.className = 'donut-card reveal';
      card.innerHTML = `
        <img class="donut-card-img" src="${item.image_url}" alt="${item.name}" loading="lazy"
             onerror="this.style.background='${item.glaze_color}20';this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\'  viewBox=\\'0 0 300 220\\'><text y=\\'50%\\' x=\\'50%\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\' font-size=\\'80\\'>🍩</text></svg>'">
        <div class="donut-card-body">
          <div class="donut-cat">${item.category}</div>
          <div class="donut-name">${item.name}</div>
          <div class="donut-desc">${item.description}</div>
          <div class="donut-footer">
            <div class="donut-price">${item.price.toFixed(2)} JD</div>
            <button class="add-btn" onclick="Cart.add({id:${item.id},name:'${item.name.replace(/'/g,"\\'")}',price:${item.price},image_url:'${item.image_url}'});event.stopPropagation()">Add to Cart</button>
          </div>
        </div>`;
      card.addEventListener('click', () => window.location.href = '/menu');
      grid.appendChild(card);
    });
    // re-observe new elements
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
      }, { threshold: 0.1 });
      obs.observe(el);
    });
  } catch(e) {
    grid.innerHTML = '<p style="color:var(--muted);padding:20px">Could not load menu.</p>';
  }
}

// ── LOAD HSCROLL CARDS (home gallery) ──────────────────────
async function loadHScrollCards() {
  const track = document.getElementById('hscrollTrack');
  if (!track) return;
  try {
    const res  = await fetch('/api/menu');
    const data = await res.json();
    track.innerHTML = '';
    data.forEach(item => {
      const card = document.createElement('div');
      card.className = 'hcard';
      card.innerHTML = `
        <div class="hcard-inner">
          <img class="hcard-img" src="${item.image_url}" alt="${item.name}" loading="lazy"
               onerror="this.style.background='${item.glaze_color}40';this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 300 400\\'><text y=\\'50%\\' x=\\'50%\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\' font-size=\\'100\\'>🍩</text></svg>'">
          <div class="hcard-overlay"></div>
          <button class="hcard-add" onclick="Cart.add({id:${item.id},name:'${item.name.replace(/'/g,"\\'")}',price:${item.price},image_url:'${item.image_url}'});event.stopPropagation()">+</button>
          <div class="hcard-info">
            <div class="hcard-name">${item.name}</div>
            <div class="hcard-price">${item.price.toFixed(2)} JD</div>
          </div>
        </div>`;
      track.appendChild(card);
    });
  } catch(e) { console.error(e); }
}
