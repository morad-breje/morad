import sqlite3, json, uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, g
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'donuts.db')

# ── DB helpers ──────────────────────────────────────────────────────────────
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db: db.close()

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.executescript('''
        CREATE TABLE IF NOT EXISTS menu (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            description TEXT,
            price       REAL NOT NULL,
            category    TEXT DEFAULT "classic",
            image_url   TEXT,
            emoji       TEXT DEFAULT "🍩",
            glaze_color TEXT DEFAULT "#E8834A",
            topping     TEXT DEFAULT "none",
            available   INTEGER DEFAULT 1,
            created_at  TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS orders (
            id          TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            phone       TEXT NOT NULL,
            address     TEXT,
            order_type  TEXT DEFAULT "pickup",
            items       TEXT NOT NULL,
            total       REAL NOT NULL,
            status      TEXT DEFAULT "pending",
            note        TEXT,
            created_at  TEXT DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    # seed menu if empty
    count = db.execute('SELECT COUNT(*) FROM menu').fetchone()[0]
    if count == 0:
        items = [
            ("Glazed Classic",        "Our original warm vanilla glaze — a timeless everyday favourite.",                1.5,  "classic",   "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80", "🍩", "#E8834A",  "glaze",       1),
            ("Rose Water Swirl",      "Delicate Jordanian rose water glaze with pink sugar sprinkles on top.",           2.0,  "signature", "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=600&q=80", "🌹", "#F2A7C3",  "sprinkles",   1),
            ("Pistachio Dream",       "Crushed roasted pistachio topping over a silky cream-filled ring.",               2.5,  "signature", "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80", "🟢", "#B8E04A",  "pistachio",   1),
            ("Dark Chocolate Bliss",  "Rich Belgian dark chocolate glaze with cocoa nibs crumble.",                      2.5,  "classic",   "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80", "🍫", "#3D1A0A",  "cocoa",       1),
            ("Caramel Crunch",        "Thick salted caramel drizzle with golden toffee crunch pieces.",                  2.5,  "signature", "https://images.unsplash.com/photo-1514517604298-cf80e0fb7f1e?w=600&q=80", "🍯", "#C0712A",  "toffee",      1),
            ("Sprinkle Galaxy",       "Fluffy vanilla glaze buried under an avalanche of rainbow sprinkles.",            2.0,  "fun",       "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=600&q=80", "🌈", "#7E4CC6",  "sprinkles",   1),
            ("Lotus Butter",          "Creamy Lotus Biscoff spread glaze with a whole biscuit on top.",                  3.0,  "signature", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80", "🍪", "#C07A2A",  "biscuit",     1),
            ("Mango Tango",           "Fresh mango purée glaze with toasted coconut shreds and a mango chilli kick.",    2.5,  "seasonal",  "https://images.unsplash.com/photo-1571506165871-ee72a35bc9d4?w=600&q=80", "🥭", "#FFC72C",  "coconut",     1),
            ("Strawberry Fields",     "House-made strawberry compote glaze with freeze-dried berry crumble.",            2.0,  "classic",   "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80", "🍓", "#E8536A",  "berry",       1),
            ("Nutella Volcano",       "Warm Nutella-filled ring that oozes hazelnut on first bite.",                     3.0,  "signature", "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80", "🌋", "#5C3317",  "hazelnut",    1),
            ("Cinnamon Sugar Ring",   "Classic cinnamon-sugar dusted ring with a hint of cardamom — café style.",        1.5,  "classic",   "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80", "✨", "#D4A017",  "sugar",       1),
            ("Blue Velvet",           "Striking blue velvet glaze with white cream cheese frosting swirl.",              2.5,  "fun",       "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=600&q=80", "💙", "#4A90D9",  "cream",       1),
        ]
        db.executemany(
            'INSERT INTO menu (name,description,price,category,image_url,emoji,glaze_color,topping,available) VALUES (?,?,?,?,?,?,?,?,?)',
            items
        )
        db.commit()
    db.close()

# ── Static pages ─────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('templates', 'index.html')

@app.route('/menu')
def menu_page():
    return send_from_directory('templates', 'menu.html')

@app.route('/order')
def order_page():
    return send_from_directory('templates', 'order.html')

@app.route('/admin')
def admin_page():
    return send_from_directory('templates', 'admin.html')

# ── API: Menu ────────────────────────────────────────────────────────────────
@app.route('/api/menu')
def api_menu():
    category = request.args.get('category')
    db = get_db()
    if category and category != 'all':
        rows = db.execute('SELECT * FROM menu WHERE available=1 AND category=? ORDER BY category,id', (category,)).fetchall()
    else:
        rows = db.execute('SELECT * FROM menu WHERE available=1 ORDER BY category,id').fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/menu/<int:item_id>')
def api_menu_item(item_id):
    db = get_db()
    row = db.execute('SELECT * FROM menu WHERE id=?', (item_id,)).fetchone()
    if not row: return jsonify({'error':'Not found'}), 404
    return jsonify(dict(row))

# ── API: Orders ──────────────────────────────────────────────────────────────
@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json
    if not data: return jsonify({'error':'No data'}), 400
    required = ['customer_name','phone','items']
    for f in required:
        if f not in data:
            return jsonify({'error': f'Missing field: {f}'}), 400
    if not data['items']:
        return jsonify({'error':'Cart is empty'}), 400

    order_id = str(uuid.uuid4())[:8].upper()
    items_json = json.dumps(data['items'])
    total = sum(i['price'] * i['qty'] for i in data['items'])
    db = get_db()
    db.execute(
        'INSERT INTO orders (id,customer_name,phone,address,order_type,items,total,note) VALUES (?,?,?,?,?,?,?,?)',
        (order_id, data['customer_name'], data['phone'],
         data.get('address',''), data.get('order_type','pickup'),
         items_json, total, data.get('note',''))
    )
    db.commit()
    return jsonify({'order_id': order_id, 'total': total, 'status': 'pending'}), 201

@app.route('/api/orders/<order_id>')
def get_order(order_id):
    db = get_db()
    row = db.execute('SELECT * FROM orders WHERE id=?', (order_id.upper(),)).fetchone()
    if not row: return jsonify({'error':'Order not found'}), 404
    d = dict(row)
    d['items'] = json.loads(d['items'])
    return jsonify(d)

# ── API: Admin orders ─────────────────────────────────────────────────────────
@app.route('/api/admin/orders')
def admin_orders():
    db = get_db()
    rows = db.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d['items'] = json.loads(d['items'])
        result.append(d)
    return jsonify(result)

@app.route('/api/admin/orders/<order_id>/status', methods=['PATCH'])
def update_status(order_id):
    data = request.json
    status = data.get('status')
    valid = ['pending','confirmed','preparing','ready','delivered','cancelled']
    if status not in valid:
        return jsonify({'error':'Invalid status'}), 400
    db = get_db()
    db.execute('UPDATE orders SET status=? WHERE id=?', (status, order_id.upper()))
    db.commit()
    return jsonify({'ok': True, 'status': status})

@app.route('/api/admin/stats')
def admin_stats():
    db = get_db()
    total_orders = db.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    total_revenue = db.execute("SELECT COALESCE(SUM(total),0) FROM orders WHERE status!='cancelled'").fetchone()[0]
    pending = db.execute("SELECT COUNT(*) FROM orders WHERE status='pending'").fetchone()[0]
    today = db.execute("SELECT COUNT(*) FROM orders WHERE date(created_at)=date('now')").fetchone()[0]
    return jsonify({'total_orders':total_orders,'total_revenue':round(total_revenue,2),'pending':pending,'today':today})

if __name__ == '__main__':
    init_db()
    print('\n🍩  Astro Donuts server running!')
    print('   Home:  http://localhost:5000')
    print('   Menu:  http://localhost:5000/menu')
    print('   Order: http://localhost:5000/order')
    print('   Admin: http://localhost:5000/admin\n')
    app.run(debug=True, port=5000)
