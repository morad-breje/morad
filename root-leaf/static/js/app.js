/* ═══════════════════════════════════════════════════════════════════════
   ROOT & LEAF — app.js
   Global UI behaviours: loader, cursor, navbar, reveal animations,
   hero particle canvas, floating leaves, newsletter, home page data.
═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ─── Loader ─────────────────────────────────────────────────────── */
  const loader = document.getElementById("loader");
  if (loader) {
    window.addEventListener("load", () => {
      setTimeout(() => loader.classList.add("hidden"), 1400);
    });
  }

  /* ─── Custom Cursor ──────────────────────────────────────────────── */
  const cursor   = document.getElementById("cursor");
  const follower = document.getElementById("cursor-follower");

  if (cursor && follower && window.matchMedia("(pointer: fine)").matches) {
    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener("mousemove", e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = `${mouseX}px`;
      cursor.style.top  = `${mouseY}px`;
    });

    function animateFollower() {
      followerX += (mouseX - followerX) * 0.12;
      followerY += (mouseY - followerY) * 0.12;
      follower.style.left = `${followerX}px`;
      follower.style.top  = `${followerY}px`;
      requestAnimationFrame(animateFollower);
    }
    animateFollower();

    // Hover states
    document.addEventListener("mouseover", e => {
      const tgt = e.target.closest("a, button, [data-hover]");
      if (tgt) {
        cursor.classList.add("cursor--hover");
        follower.classList.add("cursor--hover");
      }
    });
    document.addEventListener("mouseout", e => {
      const tgt = e.target.closest("a, button, [data-hover]");
      if (tgt) {
        cursor.classList.remove("cursor--hover");
        follower.classList.remove("cursor--hover");
      }
    });
  }

  /* ─── Sticky Navbar ──────────────────────────────────────────────── */
  const navbar = document.getElementById("navbar");
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle("nav--scrolled", window.scrollY > 60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ─── Mobile Menu ────────────────────────────────────────────────── */
  const menuToggle = document.getElementById("menuToggle");
  const menuClose  = document.getElementById("menuClose");
  const mobileMenu = document.getElementById("mobileMenu");

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      mobileMenu.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  }
  if (menuClose && mobileMenu) {
    menuClose.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      document.body.style.overflow = "";
    });
  }
  if (mobileMenu) {
    mobileMenu.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        document.body.style.overflow = "";
      })
    );
  }

  /* ─── Reveal on Scroll ───────────────────────────────────────────── */
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("revealed");
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add("revealed"));
  }

  /* ─── Smooth Scroll for anchor links ────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const id = a.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const offsetTop = target.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top: offsetTop, behavior: "smooth" });
      }
    });
  });

  /* ─── Hero Particle Canvas ───────────────────────────────────────── */
  const canvas = document.getElementById("particleCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let W, H;

    function resizeCanvas() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x    = Math.random() * W;
        this.y    = Math.random() * H;
        this.r    = Math.random() * 2.5 + .5;
        this.vx   = (Math.random() - .5) * .3;
        this.vy   = -(Math.random() * .6 + .2);
        this.life = 1;
        this.fade = Math.random() * .006 + .003;
      }
      update() {
        this.x    += this.vx;
        this.y    += this.vy;
        this.life -= this.fade;
        if (this.life <= 0 || this.y < -10) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(74,124,89,${this.life * .6})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < 80; i++) particles.push(new Particle());

    function animateParticles() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  /* ─── Newsletter form ────────────────────────────────────────────── */
  const newsletterForm = document.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", e => {
      e.preventDefault();
      const input = newsletterForm.querySelector("input");
      if (input && input.value) {
        window.RL && window.RL.showToast("You're on the list! Welcome to Root & Leaf.", "success");
        input.value = "";
      }
    });
  }

  /* ─── Nav Search button (simple redirect) ────────────────────────── */
  const navSearchBtn = document.getElementById("navSearchBtn");
  if (navSearchBtn) {
    navSearchBtn.addEventListener("click", () => {
      if (window.location.pathname === "/plants") {
        const si = document.getElementById("searchInput");
        if (si) { si.focus(); si.scrollIntoView({ behavior: "smooth", block: "center" }); }
      } else {
        window.location.href = "/plants";
      }
    });
  }

  /* ─── Home page: load featured + bestsellers ─────────────────────── */
  const featuredGrid   = document.getElementById("featuredGrid");
  const bestSellersGrid= document.getElementById("bestSellersGrid");

  if (featuredGrid || bestSellersGrid) {
    fetch("/api/plants?sort=id")
      .then(r => r.json())
      .then(plants => {
        if (featuredGrid) {
          const featured = plants.slice(0, 4);
          featuredGrid.innerHTML = featured.map(p => buildPlantCard(p)).join("");
          bindHomeCardEvents(featuredGrid);
        }
        if (bestSellersGrid) {
          // Pick a varied set for best-sellers
          const picks = [plants[6], plants[10], plants[16], plants[18]].filter(Boolean);
          bestSellersGrid.innerHTML = picks.map(p => buildPlantCard(p)).join("");
          bindHomeCardEvents(bestSellersGrid);
        }
        // Observe new cards for reveal
        document.querySelectorAll(".plant-card.reveal-card").forEach(el => {
          el.classList.add("reveal");
          if ("IntersectionObserver" in window) {
            const io = new IntersectionObserver(entries => {
              entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add("revealed"); io.unobserve(e.target); }
              });
            }, { threshold: 0.1 });
            io.observe(el);
          } else {
            el.classList.add("revealed");
          }
        });
      })
      .catch(() => {
        if (featuredGrid) featuredGrid.innerHTML = "<p style='color:var(--text-muted);text-align:center;grid-column:1/-1'>Unable to load plants.</p>";
      });
  }

  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildPlantCard(p) {
    const petIcon = p.pet_safe
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`;

    return `
      <div class="plant-card reveal-card" data-id="${esc(p.id)}" data-plant='${JSON.stringify(p).replace(/'/g, "&#39;")}'>
        <div class="plant-card__image-wrap">
          <img src="${esc(p.image_url)}" alt="${esc(p.name)}" class="plant-card__image" loading="lazy"/>
          <span class="plant-card__diff-badge plant-card__diff-badge--${esc(p.difficulty)}">${esc(p.difficulty)}</span>
          <button class="plant-card__fav ${window.RL && window.RL.isFavourite(p.id) ? 'active' : ''}" data-fav="${esc(p.id)}" aria-label="Favourite">
            ${petIcon}
          </button>
        </div>
        <div class="plant-card__body">
          <p class="plant-card__category">${esc(p.category)}</p>
          <h3 class="plant-card__name">${esc(p.name)}</h3>
          <p class="plant-card__sci">${esc(p.scientific_name)}</p>
          <div class="plant-card__footer">
            <span class="plant-card__price">£${Number(p.price).toFixed(2)}</span>
            <button class="plant-card__btn" data-quick="${esc(p.id)}">View Details</button>
          </div>
        </div>
      </div>
    `;
  }

  function bindHomeCardEvents(container) {
    container.querySelectorAll("[data-fav]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        if (!window.RL) return;
        const id   = parseInt(btn.dataset.fav);
        const now  = window.RL.toggleFavourite(id);
        btn.classList.toggle("active", now);
        window.RL.showToast(now ? "Added to favourites." : "Removed from favourites.", "info");
      });
    });

    container.querySelectorAll("[data-quick]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const card = btn.closest("[data-plant]");
        if (card) {
          // navigate to plants page with search
          const p = JSON.parse(card.dataset.plant.replace(/&#39;/g, "'"));
          window.location.href = `/plants#plant-${p.id}`;
        }
      });
    });

    // Full card click → navigate to plants page
    container.querySelectorAll(".plant-card").forEach(card => {
      card.addEventListener("click", e => {
        if (e.target.closest("button")) return;
        const p = JSON.parse(card.dataset.plant.replace(/&#39;/g, "'"));
        window.location.href = `/plants#plant-${p.id}`;
      });
    });
  }

  /* ─── Tab navigation via [data-tab] ─────────────────────────────── */
  document.querySelectorAll("[data-tab]").forEach(btn => {
    if (btn.closest(".admin-nav")) return; // handled by admin.js
    btn.addEventListener("click", e => {
      e.preventDefault();
      const target = btn.dataset.tab;
      const section = document.getElementById(target);
      if (section) section.scrollIntoView({ behavior: "smooth" });
    });
  });

})();
