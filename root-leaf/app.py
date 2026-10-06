"""
Root & Leaf — Premium Indoor Plant Boutique
Flask backend with SQLite database.
Run: python app.py
"""

import sqlite3
import json
import os
import uuid
from datetime import datetime
from functools import wraps
from werkzeug.utils import secure_filename
from flask import Flask, render_template, jsonify, request, g, session, redirect, url_for
from flask_cors import CORS

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE  = os.path.join(BASE_DIR, "plants.db")

# Vercel's filesystem is read-only except /tmp, so work on a copy of the DB there
if os.environ.get("VERCEL"):
    import shutil, tempfile
    _tmp_db = os.path.join(tempfile.gettempdir(), "plants.db")
    if not os.path.exists(_tmp_db):
        shutil.copy(DATABASE, _tmp_db)
    DATABASE = _tmp_db

UPLOAD_DIR = os.path.join(BASE_DIR, "static", "images", "plants")
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}
MAX_IMAGE_SIZE = 8 * 1024 * 1024  # 8 MB

app = Flask(__name__)
CORS(app)
app.config["JSON_SORT_KEYS"] = False
app.config["MAX_CONTENT_LENGTH"] = MAX_IMAGE_SIZE
# Change this secret before deploying to a public server.
app.secret_key = os.environ.get("SECRET_KEY", "rl-dev-secret-change-me")
# Admin password — override via ADMIN_PASSWORD env var in production.
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "rootleaf2025")


def allowed_image(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


@app.errorhandler(413)
def file_too_large(_e):
    return jsonify({"error": "Image must be under 8MB."}), 413


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA journal_mode=WAL")
        db.execute("PRAGMA foreign_keys=ON")
    return db


@app.teardown_appcontext
def close_db(exc):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()


def query_db(sql, args=(), one=False):
    cur = get_db().execute(sql, args)
    rv  = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv


def execute_db(sql, args=()):
    db  = get_db()
    cur = db.execute(sql, args)
    db.commit()
    return cur.lastrowid


# ---------------------------------------------------------------------------
# Schema + seed
# ---------------------------------------------------------------------------

SCHEMA = """
CREATE TABLE IF NOT EXISTS plants (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    scientific_name TEXT    NOT NULL,
    description     TEXT    NOT NULL,
    price           REAL    NOT NULL,
    category        TEXT    NOT NULL,
    difficulty      TEXT    NOT NULL,
    light           TEXT    NOT NULL,
    watering        TEXT    NOT NULL,
    humidity        TEXT    NOT NULL,
    temperature     TEXT    NOT NULL,
    pet_safe        INTEGER NOT NULL DEFAULT 0,
    height          TEXT    NOT NULL,
    stock           INTEGER NOT NULL DEFAULT 0,
    image_url       TEXT    NOT NULL,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name   TEXT    NOT NULL,
    phone           TEXT    NOT NULL,
    address         TEXT    NOT NULL,
    delivery_type   TEXT    NOT NULL DEFAULT 'delivery',
    items           TEXT    NOT NULL,
    total           REAL    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'pending',
    note            TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
"""

SAMPLE_PLANTS = [
    # ── Original 20 ──────────────────────────────────────────────────────
    {
        "name": "Monstera Deliciosa",
        "scientific_name": "Monstera deliciosa",
        "description": "The iconic split-leaf Monstera is the statement plant of the decade. Its dramatic, fenestrated leaves bring a bold tropical feel to any interior. Easy to care for and fast-growing, it transforms a room almost overnight.",
        "price": 68.00,
        "category": "Tropical",
        "difficulty": "Easy",
        "light": "Bright Indirect",
        "watering": "Weekly",
        "humidity": "High",
        "temperature": "18–27 °C",
        "pet_safe": 0,
        "height": "60–90 cm",
        "stock": 12,
        "image_url": "/static/images/plants/monstera-deliciosa.webp",
    },
    {
        "name": "Snake Plant",
        "scientific_name": "Sansevieria trifasciata",
        "description": "Architectural and unfussy, the Snake Plant thrives on neglect. Its upright, sword-like leaves in deep green and gold are a designer's favourite for adding structure to minimal spaces.",
        "price": 42.00,
        "category": "Succulents",
        "difficulty": "Easy",
        "light": "Low to Bright Indirect",
        "watering": "Every 2–3 Weeks",
        "humidity": "Low",
        "temperature": "15–29 °C",
        "pet_safe": 0,
        "height": "45–90 cm",
        "stock": 20,
        "image_url": "https://images.unsplash.com/photo-1572688484438-313a6a50be7c?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Peace Lily",
        "scientific_name": "Spathiphyllum wallisii",
        "description": "Graceful and shade-tolerant, the Peace Lily produces elegant white blooms and glossy leaves. It is renowned for purifying indoor air and brings a sense of calm to any room.",
        "price": 38.00,
        "category": "Flowering",
        "difficulty": "Easy",
        "light": "Low to Medium Indirect",
        "watering": "Weekly",
        "humidity": "Medium",
        "temperature": "18–26 °C",
        "pet_safe": 0,
        "height": "45–65 cm",
        "stock": 15,
        "image_url": "https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Rubber Plant",
        "scientific_name": "Ficus elastica",
        "description": "Bold burgundy leaves with a mirror sheen make the Rubber Plant one of the most striking houseplants available. Its tree-like form lends architectural gravitas to living spaces.",
        "price": 55.00,
        "category": "Tropical",
        "difficulty": "Easy",
        "light": "Bright Indirect",
        "watering": "Every 1–2 Weeks",
        "humidity": "Medium",
        "temperature": "15–24 °C",
        "pet_safe": 0,
        "height": "60–120 cm",
        "stock": 8,
        "image_url": "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Bird of Paradise",
        "scientific_name": "Strelitzia reginae",
        "description": "Dramatic paddle-shaped leaves and the promise of exotic orange blooms make the Bird of Paradise the ultimate statement plant. A sun-lover that rewards patience with breathtaking results.",
        "price": 95.00,
        "category": "Tropical",
        "difficulty": "Moderate",
        "light": "Full to Bright Indirect",
        "watering": "Weekly in summer",
        "humidity": "Medium",
        "temperature": "18–30 °C",
        "pet_safe": 0,
        "height": "90–150 cm",
        "stock": 5,
        "image_url": "https://images.unsplash.com/photo-1620127252536-03bdffd80ef3?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "ZZ Plant",
        "scientific_name": "Zamioculcas zamiifolia",
        "description": "Virtually indestructible, the ZZ Plant sports glossy, deep-green leaflets on graceful arching stems. It tolerates low light and irregular watering with stoic elegance.",
        "price": 45.00,
        "category": "Succulents",
        "difficulty": "Easy",
        "light": "Low to Bright Indirect",
        "watering": "Every 2–3 Weeks",
        "humidity": "Low",
        "temperature": "15–26 °C",
        "pet_safe": 0,
        "height": "45–75 cm",
        "stock": 18,
        "image_url": "https://images.unsplash.com/photo-1612024782955-49fae79e42bb?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Golden Pothos",
        "scientific_name": "Epipremnum aureum",
        "description": "Heart-shaped leaves marbled in green and gold cascade effortlessly from shelves or trail from hanging baskets. The Pothos is a forgiving, fast-growing beauty that suits every skill level.",
        "price": 28.00,
        "category": "Trailing",
        "difficulty": "Easy",
        "light": "Low to Bright Indirect",
        "watering": "Weekly",
        "humidity": "Low to Medium",
        "temperature": "15–29 °C",
        "pet_safe": 0,
        "height": "Trailing to 2 m+",
        "stock": 25,
        "image_url": "https://images.unsplash.com/photo-1597055181321-4d9fac2e2d34?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Spider Plant",
        "scientific_name": "Chlorophytum comosum",
        "description": "Arching, variegated ribbons of green and white with cascading 'spiderettes' — this cheerful plant is one of the best air purifiers and utterly safe for homes with pets.",
        "price": 22.00,
        "category": "Trailing",
        "difficulty": "Easy",
        "light": "Bright Indirect",
        "watering": "Weekly",
        "humidity": "Medium",
        "temperature": "13–27 °C",
        "pet_safe": 1,
        "height": "30–60 cm + spiderettes",
        "stock": 22,
        "image_url": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Chinese Evergreen",
        "scientific_name": "Aglaonema commutatum",
        "description": "Patterned leaves in shades of silver, green, and blush make Aglaonema a living work of art. It thrives in low light and adds luxurious colour without demanding much care.",
        "price": 35.00,
        "category": "Tropical",
        "difficulty": "Easy",
        "light": "Low to Medium Indirect",
        "watering": "Every 1–2 Weeks",
        "humidity": "Medium",
        "temperature": "16–24 °C",
        "pet_safe": 0,
        "height": "30–60 cm",
        "stock": 14,
        "image_url": "https://images.unsplash.com/photo-1598880940371-c756e015fea1?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Calathea Orbifolia",
        "scientific_name": "Calathea orbifolia",
        "description": "Large, coin-shaped leaves striped in silver and green, and leaves that fold at night — the Calathea Orbifolia is the living sculpture of the plant world. A collector's gem.",
        "price": 58.00,
        "category": "Tropical",
        "difficulty": "Expert",
        "light": "Low to Medium Indirect",
        "watering": "Weekly, distilled water",
        "humidity": "High",
        "temperature": "18–24 °C",
        "pet_safe": 1,
        "height": "40–60 cm",
        "stock": 7,
        "image_url": "https://images.unsplash.com/photo-1641903469783-d3d98e7b286e?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Fiddle Leaf Fig",
        "scientific_name": "Ficus lyrata",
        "description": "Enormous, violin-shaped leaves on a slender trunk — the Fiddle Leaf Fig is the most coveted plant of modern interior design. Aspirational, photogenic, and worth every effort.",
        "price": 110.00,
        "category": "Trees",
        "difficulty": "Expert",
        "light": "Bright Indirect",
        "watering": "Weekly",
        "humidity": "Medium to High",
        "temperature": "16–24 °C",
        "pet_safe": 0,
        "height": "100–200 cm",
        "stock": 4,
        "image_url": "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Philodendron Brasil",
        "scientific_name": "Philodendron hederaceum 'Brasil'",
        "description": "Heart-shaped leaves splashed with chartreuse and deep green, trailing with effortless beauty. The Brasil is one of the most vibrant and easy-to-grow Philodendrons available.",
        "price": 32.00,
        "category": "Trailing",
        "difficulty": "Easy",
        "light": "Bright Indirect",
        "watering": "Weekly",
        "humidity": "Medium",
        "temperature": "16–26 °C",
        "pet_safe": 0,
        "height": "Trailing to 1.5 m+",
        "stock": 16,
        "image_url": "https://images.unsplash.com/photo-1616694158188-f8b49e2f1a2e?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Aloe Vera",
        "scientific_name": "Aloe barbadensis miller",
        "description": "Beyond its iconic healing gel, Aloe Vera is a sculptural succulent with upright fleshy spears edged in pale serrations. Near-zero maintenance and endlessly useful.",
        "price": 24.00,
        "category": "Succulents",
        "difficulty": "Easy",
        "light": "Bright Direct to Indirect",
        "watering": "Every 2–3 Weeks",
        "humidity": "Low",
        "temperature": "13–27 °C",
        "pet_safe": 0,
        "height": "30–60 cm",
        "stock": 30,
        "image_url": "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Jade Plant",
        "scientific_name": "Crassula ovata",
        "description": "Plump, jade-green oval leaves on woody stems give this succulent the look of a miniature tree. Long-lived and considered a symbol of good fortune, it is a timeless classic.",
        "price": 30.00,
        "category": "Succulents",
        "difficulty": "Easy",
        "light": "Bright Direct to Indirect",
        "watering": "Every 2–3 Weeks",
        "humidity": "Low",
        "temperature": "10–24 °C",
        "pet_safe": 0,
        "height": "30–90 cm",
        "stock": 19,
        "image_url": "https://images.unsplash.com/photo-1603436326446-74f8a98c2ade?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Boston Fern",
        "scientific_name": "Nephrolepis exaltata",
        "description": "Lush, feathery arching fronds that bring a verdant, jungle-like energy to interiors. The Boston Fern is a lush classic that thrives in humid rooms like bathrooms.",
        "price": 36.00,
        "category": "Ferns",
        "difficulty": "Moderate",
        "light": "Bright Indirect",
        "watering": "Keep soil moist",
        "humidity": "High",
        "temperature": "16–24 °C",
        "pet_safe": 1,
        "height": "45–75 cm",
        "stock": 11,
        "image_url": "https://images.unsplash.com/photo-1598681257962-6d1ae12c6fbe?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "English Ivy",
        "scientific_name": "Hedera helix",
        "description": "Classic three-lobed leaves trail and climb with timeless elegance. English Ivy cleans the air, adds a Gothic charm to bookshelves, and drapes beautifully from raised planters.",
        "price": 26.00,
        "category": "Trailing",
        "difficulty": "Easy",
        "light": "Bright Indirect",
        "watering": "Every 1–2 Weeks",
        "humidity": "Medium",
        "temperature": "10–21 °C",
        "pet_safe": 0,
        "height": "Trailing to 2 m+",
        "stock": 17,
        "image_url": "https://images.unsplash.com/photo-1557411732-1797a9171fcf?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Areca Palm",
        "scientific_name": "Dypsis lutescens",
        "description": "Feathery, arching fronds that create a tropical, resort-like atmosphere. The Areca Palm is one of the finest natural humidifiers and is entirely safe for pets.",
        "price": 75.00,
        "category": "Palms",
        "difficulty": "Moderate",
        "light": "Bright Indirect",
        "watering": "Weekly in summer",
        "humidity": "High",
        "temperature": "16–27 °C",
        "pet_safe": 1,
        "height": "90–200 cm",
        "stock": 6,
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Money Tree",
        "scientific_name": "Pachira aquatica",
        "description": "Five-lobed leaves atop a braided trunk — the Money Tree is as much a sculptural centrepiece as a plant. Symbolising prosperity in many cultures, it is cherished worldwide.",
        "price": 62.00,
        "category": "Trees",
        "difficulty": "Easy",
        "light": "Bright Indirect",
        "watering": "Weekly",
        "humidity": "Medium",
        "temperature": "16–29 °C",
        "pet_safe": 1,
        "height": "60–150 cm",
        "stock": 9,
        "image_url": "https://images.unsplash.com/photo-1603733342315-f6c525fea09d?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Prayer Plant",
        "scientific_name": "Maranta leuconeura",
        "description": "Velvety leaves painted with red veins fold upward at night like hands in prayer. The Maranta is a living performance of colour and movement that never grows old.",
        "price": 34.00,
        "category": "Tropical",
        "difficulty": "Moderate",
        "light": "Low to Medium Indirect",
        "watering": "Weekly",
        "humidity": "High",
        "temperature": "18–27 °C",
        "pet_safe": 1,
        "height": "20–30 cm",
        "stock": 13,
        "image_url": "https://images.unsplash.com/photo-1618912560627-2d2d8741cf4b?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "String of Pearls",
        "scientific_name": "Curio rowleyanus",
        "description": "Delicate bead-like leaves cascade down in gossamer strings — the String of Pearls is one of the most sculptural and sought-after succulents in contemporary plant collecting.",
        "price": 48.00,
        "category": "Succulents",
        "difficulty": "Moderate",
        "light": "Bright Indirect to Direct",
        "watering": "Every 2 Weeks",
        "humidity": "Low",
        "temperature": "15–26 °C",
        "pet_safe": 0,
        "height": "Trailing to 60 cm",
        "stock": 10,
        "image_url": "https://images.unsplash.com/photo-1552083375-1447ce886485?auto=format&fit=crop&w=800&q=80",
    },

    # ── New Flowers ───────────────────────────────────────────────────────
    {
        "name": "Phalaenopsis Orchid",
        "scientific_name": "Phalaenopsis amabilis",
        "description": "The queen of flowering houseplants, the moth orchid produces arching sprays of delicate blooms in white, pink, and purple that last for months. Elegant, long-lasting, and surprisingly easy to care for.",
        "price": 54.00,
        "category": "Flowering",
        "difficulty": "Easy",
        "light": "Bright Indirect",
        "watering": "Every 7–10 days",
        "humidity": "Medium to High",
        "temperature": "18–25 °C",
        "pet_safe": 1,
        "height": "30–60 cm",
        "stock": 14,
        "image_url": "https://images.unsplash.com/photo-1524593166156-312f362cada0?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "African Violet",
        "scientific_name": "Saintpaulia ionantha",
        "description": "Compact rosettes of velvety deep-green leaves crowned with clusters of vibrant purple, pink or white blooms. African Violets flower almost year-round and thrive beautifully on a bright windowsill.",
        "price": 18.00,
        "category": "Flowering",
        "difficulty": "Easy",
        "light": "Bright Indirect",
        "watering": "Water from below, weekly",
        "humidity": "Medium",
        "temperature": "18–24 °C",
        "pet_safe": 1,
        "height": "10–20 cm",
        "stock": 28,
        "image_url": "https://images.unsplash.com/photo-1599598425947-5202edd56fdf?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Anthurium",
        "scientific_name": "Anthurium andraeanum",
        "description": "Waxy, heart-shaped spathes in blazing red, coral or white surround a golden spadix. Anthurium is the most glamorous long-flowering plant available — blooms last 8–12 weeks and return reliably throughout the year.",
        "price": 46.00,
        "category": "Flowering",
        "difficulty": "Moderate",
        "light": "Bright Indirect",
        "watering": "Weekly",
        "humidity": "High",
        "temperature": "18–27 °C",
        "pet_safe": 0,
        "height": "30–50 cm",
        "stock": 11,
        "image_url": "https://images.unsplash.com/photo-1574594942426-bbd9f3a72f81?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Kalanchoe",
        "scientific_name": "Kalanchoe blossfeldiana",
        "description": "Clusters of cheerful, long-lasting flowers in shades of red, orange, yellow, and pink sit above thick, glossy leaves. Kalanchoe is one of the most rewarding and low-maintenance flowering succulents you can own.",
        "price": 16.00,
        "category": "Flowering",
        "difficulty": "Easy",
        "light": "Bright Indirect to Direct",
        "watering": "Every 2 Weeks",
        "humidity": "Low",
        "temperature": "15–24 °C",
        "pet_safe": 0,
        "height": "20–45 cm",
        "stock": 32,
        "image_url": "https://images.unsplash.com/photo-1609847996955-b86d2c03b16b?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Cyclamen",
        "scientific_name": "Cyclamen persicum",
        "description": "Swept-back petals in cerise, salmon, white, and deep magenta hover above silvery marbled foliage. Cyclamen are autumn and winter royalty, filling rooms with colour precisely when most other plants rest.",
        "price": 22.00,
        "category": "Flowering",
        "difficulty": "Moderate",
        "light": "Bright Indirect",
        "watering": "Water from below, twice weekly",
        "humidity": "Medium",
        "temperature": "10–18 °C",
        "pet_safe": 0,
        "height": "15–30 cm",
        "stock": 20,
        "image_url": "https://images.unsplash.com/photo-1573227895251-6e0ff5ff44f5?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Lavender",
        "scientific_name": "Lavandula angustifolia",
        "description": "Spikes of violet-blue flowers rising from silver-green aromatic foliage bring a slice of the Provençal countryside indoors. Lavender is calming, fragrant, and doubles as a natural air freshener.",
        "price": 20.00,
        "category": "Flowering",
        "difficulty": "Moderate",
        "light": "Full Sun / Bright Direct",
        "watering": "Every 1–2 Weeks",
        "humidity": "Low",
        "temperature": "15–22 °C",
        "pet_safe": 0,
        "height": "30–60 cm",
        "stock": 18,
        "image_url": "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Hibiscus",
        "scientific_name": "Hibiscus rosa-sinensis",
        "description": "Enormous, trumpet-shaped blooms in flaming red, tangerine, and tropical pink make Indoor Hibiscus an undeniable showstopper. Each individual flower opens for a single sun-drenched day — but new buds appear constantly.",
        "price": 38.00,
        "category": "Flowering",
        "difficulty": "Moderate",
        "light": "Full Sun / Bright Direct",
        "watering": "Generously in summer",
        "humidity": "Medium",
        "temperature": "18–30 °C",
        "pet_safe": 1,
        "height": "60–120 cm",
        "stock": 9,
        "image_url": "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Jasmine",
        "scientific_name": "Jasminum polyanthum",
        "description": "Delicate star-shaped white flowers exhale one of the most intoxicating natural fragrances in the world. A single pot of Jasmine in bloom can scent an entire room. Train it up a hoop or let it cascade freely.",
        "price": 28.00,
        "category": "Flowering",
        "difficulty": "Moderate",
        "light": "Bright Indirect to Direct",
        "watering": "Weekly, keep moist in bloom",
        "humidity": "Medium",
        "temperature": "16–24 °C",
        "pet_safe": 0,
        "height": "Climbing to 90 cm+ on a hoop",
        "stock": 15,
        "image_url": "https://images.unsplash.com/photo-1592491204484-c4a2d4600a42?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Gardenia",
        "scientific_name": "Gardenia jasminoides",
        "description": "Creamy white, multi-petalled blooms with a heady, sweet perfume against glossy evergreen foliage. The Gardenia is the pinnacle of flowering houseplants — demanding, but utterly worth the devotion.",
        "price": 44.00,
        "category": "Flowering",
        "difficulty": "Expert",
        "light": "Bright Indirect",
        "watering": "Keep consistently moist",
        "humidity": "High",
        "temperature": "16–24 °C",
        "pet_safe": 0,
        "height": "30–90 cm",
        "stock": 7,
        "image_url": "https://images.unsplash.com/photo-1585168064935-7f0b73d66f21?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Chrysanthemum",
        "scientific_name": "Chrysanthemum morifolium",
        "description": "Dense pompoms of petals in gold, burgundy, white, and apricot — the Chrysanthemum is autumn's richest gift. An exceptional air purifier and one of the most cheerful seasonal flowering plants available.",
        "price": 20.00,
        "category": "Flowering",
        "difficulty": "Easy",
        "light": "Bright Indirect",
        "watering": "Keep soil evenly moist",
        "humidity": "Medium",
        "temperature": "10–20 °C",
        "pet_safe": 0,
        "height": "30–60 cm",
        "stock": 24,
        "image_url": "https://images.unsplash.com/photo-1576803535793-8e0e9cd5e283?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Hoya Carnosa",
        "scientific_name": "Hoya carnosa",
        "description": "Thick, glossy leaves and clusters of perfectly formed, star-shaped porcelain flowers with a sweet honey scent. The Hoya is slow but spectacular — a collector's plant that rewards patience with extraordinary blooms.",
        "price": 36.00,
        "category": "Trailing",
        "difficulty": "Easy",
        "light": "Bright Indirect",
        "watering": "Every 2 Weeks",
        "humidity": "Medium",
        "temperature": "16–27 °C",
        "pet_safe": 1,
        "height": "Trailing / Climbing to 1 m+",
        "stock": 13,
        "image_url": "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Oxalis",
        "scientific_name": "Oxalis triangularis",
        "description": "Dramatic deep-purple butterfly-shaped leaves that open and close with the light, crowned by delicate pale-pink blooms. Oxalis is one of the most visually striking and conversation-starting houseplants available.",
        "price": 18.00,
        "category": "Flowering",
        "difficulty": "Easy",
        "light": "Bright Indirect",
        "watering": "Weekly",
        "humidity": "Low to Medium",
        "temperature": "15–24 °C",
        "pet_safe": 0,
        "height": "20–30 cm",
        "stock": 21,
        "image_url": "https://images.unsplash.com/photo-1597149416697-96cfc7d72d95?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Bromeliad",
        "scientific_name": "Guzmania lingulata",
        "description": "A blazing star-shaped flower spike in vivid red or orange rises from a rosette of glossy strap leaves, lasting for months. Bromeliads are the most theatrical flowering plants for low-light rooms.",
        "price": 32.00,
        "category": "Tropical",
        "difficulty": "Easy",
        "light": "Low to Medium Indirect",
        "watering": "Fill central cup, mist weekly",
        "humidity": "High",
        "temperature": "18–27 °C",
        "pet_safe": 1,
        "height": "30–50 cm",
        "stock": 10,
        "image_url": "https://images.unsplash.com/photo-1566907878854-40f24be28547?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Camellia",
        "scientific_name": "Camellia japonica",
        "description": "Rose-like blooms in deep red, shell pink, and pristine white emerge from dark, lacquered evergreen foliage. The Camellia is winter and spring's most refined flowering shrub — associated with grace and understated luxury.",
        "price": 52.00,
        "category": "Flowering",
        "difficulty": "Moderate",
        "light": "Bright Indirect",
        "watering": "Keep consistently moist",
        "humidity": "Medium",
        "temperature": "10–20 °C",
        "pet_safe": 1,
        "height": "60–120 cm",
        "stock": 8,
        "image_url": "https://images.unsplash.com/photo-1559563458-527698bf5295?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Geranium",
        "scientific_name": "Pelargonium × hortorum",
        "description": "Bold rounded clusters of flowers in scarlet, salmon, white and fuchsia above softly scented, velvety leaves. Geraniums are cheerful, sun-loving, and among the most reliably floriferous plants for bright windowsills and balconies.",
        "price": 14.00,
        "category": "Flowering",
        "difficulty": "Easy",
        "light": "Full Sun / Bright Direct",
        "watering": "Every 1–2 Weeks",
        "humidity": "Low",
        "temperature": "15–25 °C",
        "pet_safe": 0,
        "height": "25–50 cm",
        "stock": 30,
        "image_url": "https://images.unsplash.com/photo-1591958896122-c0ce93d4ced7?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Gerbera Daisy",
        "scientific_name": "Gerbera jamesonii",
        "description": "Bold, symmetrical daisy flowers in every shade from cream through lemon, coral, and deep crimson sit atop straight stems above lush, deeply-lobed foliage. Gerbera is the happiest plant in any room.",
        "price": 16.00,
        "category": "Flowering",
        "difficulty": "Moderate",
        "light": "Bright Direct to Indirect",
        "watering": "Weekly, avoid crown",
        "humidity": "Medium",
        "temperature": "16–24 °C",
        "pet_safe": 1,
        "height": "25–45 cm",
        "stock": 22,
        "image_url": "https://images.unsplash.com/photo-1490750967868-88df5691a0c9?auto=format&fit=crop&w=800&q=80",
    },
]


def init_db():
    """Initialise schema and seed sample data if the database is empty."""
    with app.app_context():
        db = get_db()
        db.executescript(SCHEMA)
        db.commit()

        # Insert any plant from SAMPLE_PLANTS that doesn't exist yet by name.
        # This lets the database gain new entries on each startup without
        # losing admin edits to existing plants.
        existing_names = {
            row[0] for row in db.execute("SELECT name FROM plants").fetchall()
        }
        new_plants = [p for p in SAMPLE_PLANTS if p["name"] not in existing_names]
        for p in new_plants:
            db.execute(
                """INSERT INTO plants
                   (name, scientific_name, description, price, category,
                    difficulty, light, watering, humidity, temperature,
                    pet_safe, height, stock, image_url)
                   VALUES (:name,:scientific_name,:description,:price,
                           :category,:difficulty,:light,:watering,
                           :humidity,:temperature,:pet_safe,:height,
                           :stock,:image_url)""",
                p,
            )
        if new_plants:
            db.commit()


# ---------------------------------------------------------------------------
# Admin authentication
# ---------------------------------------------------------------------------

def admin_required(f):
    """Decorator that requires an admin session for page and API routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("is_admin"):
            if request.path.startswith("/api/"):
                return jsonify({"error": "Unauthorized"}), 401
            return redirect(url_for("admin_login"))
        return f(*args, **kwargs)
    return decorated


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    error = None
    if request.method == "POST":
        if request.form.get("password") == ADMIN_PASSWORD:
            session["is_admin"] = True
            return redirect(url_for("admin_dashboard"))
        error = "Incorrect password."
    return render_template("admin_login.html", error=error)


@app.route("/admin/logout")
def admin_logout():
    session.pop("is_admin", None)
    return redirect(url_for("admin_login"))


# ---------------------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------------------

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/plants")
def plants():
    return render_template("plants.html")


@app.route("/checkout")
def checkout():
    return render_template("checkout.html")


@app.route("/admin")
@admin_required
def admin_dashboard():
    return render_template("admin.html")


# ---------------------------------------------------------------------------
# API — Plants
# ---------------------------------------------------------------------------

@app.route("/api/plants", methods=["GET"])
def api_plants():
    category   = request.args.get("category", "")
    search     = request.args.get("search", "")
    sort_by    = request.args.get("sort", "id")
    max_price  = request.args.get("max_price", "")

    sql    = "SELECT * FROM plants WHERE 1=1"
    params = []

    if category:
        sql += " AND LOWER(category) = LOWER(?)"
        params.append(category)

    if search:
        sql += " AND (LOWER(name) LIKE ? OR LOWER(scientific_name) LIKE ? OR LOWER(description) LIKE ?)"
        term = f"%{search.lower()}%"
        params += [term, term, term]

    if max_price:
        try:
            sql += " AND price <= ?"
            params.append(float(max_price))
        except ValueError:
            pass

    sort_map = {
        "price_asc":  "price ASC",
        "price_desc": "price DESC",
        "name":       "name ASC",
        "newest":     "created_at DESC",
        "id":         "id ASC",
    }
    sql += f" ORDER BY {sort_map.get(sort_by, 'id ASC')}"

    rows = query_db(sql, params)
    return jsonify([dict(r) for r in rows])


@app.route("/api/plants/<int:plant_id>", methods=["GET"])
def api_plant(plant_id):
    row = query_db("SELECT * FROM plants WHERE id = ?", [plant_id], one=True)
    if not row:
        return jsonify({"error": "Plant not found"}), 404
    return jsonify(dict(row))


# ---------------------------------------------------------------------------
# API — Orders
# ---------------------------------------------------------------------------

@app.route("/api/orders", methods=["POST"])
def api_create_order():
    data = request.get_json(force=True)

    required = ["customer_name", "phone", "address", "items", "total"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Missing field: {field}"}), 400

    items_json = json.dumps(data["items"])

    order_id = execute_db(
        """INSERT INTO orders
           (customer_name, phone, address, delivery_type, items, total, note)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            data["customer_name"],
            data["phone"],
            data["address"],
            data.get("delivery_type", "delivery"),
            items_json,
            data["total"],
            data.get("note", ""),
        ),
    )

    # Reduce stock for each item ordered
    for item in data["items"]:
        execute_db(
            "UPDATE plants SET stock = MAX(0, stock - ?) WHERE id = ?",
            (item.get("quantity", 1), item["id"]),
        )

    return jsonify({"order_id": order_id, "status": "pending"}), 201


@app.route("/api/orders/<int:order_id>", methods=["GET"])
def api_order(order_id):
    row = query_db("SELECT * FROM orders WHERE id = ?", [order_id], one=True)
    if not row:
        return jsonify({"error": "Order not found"}), 404
    order = dict(row)
    order["items"] = json.loads(order["items"])
    return jsonify(order)


# ---------------------------------------------------------------------------
# API — Admin
# ---------------------------------------------------------------------------

@app.route("/api/admin/orders", methods=["GET"])
@admin_required
def api_admin_orders():
    status = request.args.get("status", "")
    if status:
        rows = query_db(
            "SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC",
            [status],
        )
    else:
        rows = query_db("SELECT * FROM orders ORDER BY created_at DESC")

    orders = []
    for r in rows:
        o = dict(r)
        o["items"] = json.loads(o["items"])
        orders.append(o)
    return jsonify(orders)


@app.route("/api/admin/orders/<int:order_id>/status", methods=["PATCH"])
@admin_required
def api_update_order_status(order_id):
    data   = request.get_json(force=True)
    status = data.get("status", "")
    valid  = {"pending", "confirmed", "preparing", "ready", "delivered", "cancelled"}

    if status not in valid:
        return jsonify({"error": "Invalid status"}), 400

    row = query_db("SELECT id FROM orders WHERE id = ?", [order_id], one=True)
    if not row:
        return jsonify({"error": "Order not found"}), 404

    execute_db("UPDATE orders SET status = ? WHERE id = ?", [status, order_id])
    return jsonify({"order_id": order_id, "status": status})


@app.route("/api/admin/stats", methods=["GET"])
@admin_required
def api_admin_stats():
    db = get_db()

    total_orders   = db.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    total_revenue  = db.execute("SELECT COALESCE(SUM(total),0) FROM orders WHERE status != 'cancelled'").fetchone()[0]
    total_plants   = db.execute("SELECT COUNT(*) FROM plants").fetchone()[0]
    low_stock      = db.execute("SELECT COUNT(*) FROM plants WHERE stock <= 3").fetchone()[0]
    pending_count  = db.execute("SELECT COUNT(*) FROM orders WHERE status='pending'").fetchone()[0]
    delivered_count= db.execute("SELECT COUNT(*) FROM orders WHERE status='delivered'").fetchone()[0]

    # Revenue per category
    cat_rows = db.execute("""
        SELECT p.category, ROUND(SUM(o.total / (
            SELECT COUNT(*) FROM orders o2 WHERE o2.id = o.id
        )),2) as rev
        FROM orders o
        JOIN plants p ON 1=1
        WHERE o.status != 'cancelled'
        GROUP BY p.category
        LIMIT 6
    """).fetchall()

    # Recent orders
    recent = db.execute(
        "SELECT id, customer_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5"
    ).fetchall()

    # Orders by status
    status_rows = db.execute(
        "SELECT status, COUNT(*) as count FROM orders GROUP BY status"
    ).fetchall()

    return jsonify({
        "total_orders":    total_orders,
        "total_revenue":   round(total_revenue, 2),
        "total_plants":    total_plants,
        "low_stock":       low_stock,
        "pending_orders":  pending_count,
        "delivered_orders":delivered_count,
        "orders_by_status": [dict(r) for r in status_rows],
        "recent_orders":   [dict(r) for r in recent],
    })


@app.route("/api/admin/plants", methods=["GET"])
@admin_required
def api_admin_plants():
    rows = query_db("SELECT * FROM plants ORDER BY name")
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/plants/<int:plant_id>", methods=["PATCH"])
@admin_required
def api_admin_update_plant(plant_id):
    data  = request.get_json(force=True)
    allowed = {"name", "price", "stock", "description", "category", "difficulty"}
    sets   = []
    params = []
    for key in allowed:
        if key in data:
            sets.append(f"{key} = ?")
            params.append(data[key])
    if not sets:
        return jsonify({"error": "Nothing to update"}), 400
    # Verify plant exists before update
    if not query_db("SELECT id FROM plants WHERE id = ?", [plant_id], one=True):
        return jsonify({"error": "Plant not found"}), 404
    params.append(plant_id)
    execute_db(f"UPDATE plants SET {', '.join(sets)} WHERE id = ?", params)
    row = query_db("SELECT * FROM plants WHERE id = ?", [plant_id], one=True)
    return jsonify(dict(row))


@app.route("/api/admin/plants/<int:plant_id>/image", methods=["POST"])
@admin_required
def api_admin_upload_plant_image(plant_id):
    plant = query_db("SELECT * FROM plants WHERE id = ?", [plant_id], one=True)
    if not plant:
        return jsonify({"error": "Plant not found"}), 404

    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No image file selected"}), 400

    if not allowed_image(file.filename):
        return jsonify({"error": "Unsupported file type. Use PNG, JPG, WEBP, or GIF."}), 400

    ext = secure_filename(file.filename).rsplit(".", 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join(UPLOAD_DIR, unique_name)
    file.save(save_path)

    # Remove the old local image file if it was one we previously stored
    # (never delete external/Unsplash URLs).
    old_url = plant["image_url"]
    if old_url and old_url.startswith("/static/images/plants/"):
        old_path = os.path.join(BASE_DIR, old_url.lstrip("/"))
        if os.path.isfile(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    new_url = f"/static/images/plants/{unique_name}"
    execute_db("UPDATE plants SET image_url = ? WHERE id = ?", (new_url, plant_id))
    row = query_db("SELECT * FROM plants WHERE id = ?", [plant_id], one=True)
    return jsonify(dict(row))


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    init_db()
    print("\n🌿  Root & Leaf is running → http://127.0.0.1:5000\n")
    app.run(debug=True, host="0.0.0.0", port=5000)
