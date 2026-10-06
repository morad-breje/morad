# 🌿 Root & Leaf

> **Bring Nature Home.**

Root & Leaf is a premium indoor plant boutique — a fully functional Flask e-commerce web application with a luxury dark-theme UI, complete CRUD operations, cart management, order checkout, and an admin dashboard.

---

## Quick Start

```bash
# 1. Navigate to the project directory
cd root-leaf

# 2. Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate     # macOS / Linux
venv\Scripts\activate        # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app
python app.py
```

Open your browser at **http://127.0.0.1:5000**

The SQLite database (`plants.db`) is created automatically on first run and seeded with 20 sample plants.

---

## Project Structure

```
root-leaf/
├── app.py                  # Flask app, routes, database logic
├── requirements.txt        # Python dependencies
├── README.md               # This file
├── plants.db               # SQLite database (auto-created)
│
├── templates/
│   ├── index.html          # Home page
│   ├── plants.html         # Plant catalogue
│   ├── checkout.html       # Checkout page
│   └── admin.html          # Admin dashboard
│
└── static/
    ├── css/
    │   ├── main.css        # Global styles, tokens, shared components
    │   ├── plants.css      # Plants page specific styles
    │   └── admin.css       # Admin dashboard styles
    └── js/
        ├── cart.js         # Cart state management (localStorage)
        ├── app.js          # Global UI: loader, cursor, navbar, home data
        ├── plants.js       # Plants page: fetch, filter, sort, modal
        └── admin.js        # Admin dashboard: tabs, orders, inventory, stats
```

---

## Features

### Customer-Facing
- **Animated loading screen** with branded leaf icon
- **Custom cursor** with hover state effects
- **Hero section** with particle canvas, floating leaves, and horizontal image strip
- **Reveal animations** on scroll (IntersectionObserver)
- **Sticky navbar** that becomes opaque on scroll
- **Plants page** with:
  - Real-time search (debounced)
  - Category filter chips
  - Sort by price / name / newest
  - Max price range slider
  - Grid / list view toggle
  - Animated plant cards with hover lift
  - Quick-view modal with full care guide
  - Favourites (localStorage persisted)
- **Slide-out cart** with quantity controls, remove items, and subtotal
- **Checkout page** with home delivery / in-store pickup toggle, address form, order notes
- **Order success modal** with animated SVG checkmark and order ID
- **Toast notifications** for all user actions
- **Newsletter** subscription form
- **Fully responsive** — desktop, tablet, and mobile

### Admin Dashboard (`/admin`)
- **Dashboard** tab: stat cards (orders, revenue, inventory, low stock), recent orders table, order status breakdown
- **Orders** tab: full order list with status filter, customer search, and order detail modal with status update
- **Inventory** tab: all plants with stock indicators, edit modal (name, price, stock, category, difficulty, description)
- **Statistics** tab: animated bar chart of orders by status, revenue highlights, inventory health grid
- **Mobile-responsive** sidebar with overlay toggle

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `GET`  | `/api/plants` | List plants (supports `?category=`, `?search=`, `?sort=`, `?max_price=`) |
| `GET`  | `/api/plants/<id>` | Single plant details |
| `POST` | `/api/orders` | Create a new order |
| `GET`  | `/api/orders/<id>` | Get order by ID |
| `GET`  | `/api/admin/orders` | All orders (supports `?status=`) |
| `PATCH`| `/api/admin/orders/<id>/status` | Update order status |
| `GET`  | `/api/admin/stats` | Dashboard stats |
| `GET`  | `/api/admin/plants` | All plants (admin) |
| `PATCH`| `/api/admin/plants/<id>` | Update plant details |

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#101814` | Page background |
| Card | `#1C2620` | Card surfaces |
| Primary Green | `#4A7C59` | Buttons, badges, accents |
| Accent Green | `#B7D49B` | Highlighted text, labels |
| Gold | `#D6B46B` | Stars, warnings, gold accents |
| Text | `#F5F6F2` | Primary text |
| Muted Text | `rgba(245,246,242,.6)` | Secondary text |

**Fonts:** Bebas Neue (headings) · DM Sans (body) · Playfair Display Italic (accents)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3, Flask 3, Flask-CORS |
| Database | SQLite (via Python `sqlite3`) |
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| Fonts | Google Fonts |
| Images | Unsplash (CDN, no API key required) |

No React. No Vue. No Tailwind. No Bootstrap. Built entirely from scratch.

---

## Sample Plants Included

Monstera Deliciosa · Snake Plant · Peace Lily · Rubber Plant · Bird of Paradise · ZZ Plant · Golden Pothos · Spider Plant · Chinese Evergreen · Calathea Orbifolia · Fiddle Leaf Fig · Philodendron Brasil · Aloe Vera · Jade Plant · Boston Fern · English Ivy · Areca Palm · Money Tree · Prayer Plant · String of Pearls

---

## Requirements

- Python 3.8+
- pip

No other system dependencies required.

---

*Root & Leaf — Bring Nature Home.*
