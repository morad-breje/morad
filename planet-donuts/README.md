# Planet Donuts - Full-Stack Donut Shop Website

Planet Donuts is a fully functional donut shop web application built with Flask. It includes a customer-facing menu, ordering flow, shopping cart behavior, and an admin dashboard for viewing and managing orders.

## Project Overview

This project was created to demonstrate practical full-stack web development skills, including backend routing, REST API design, database operations, frontend interaction, and responsive page design.

## Key Features

- Home, menu, order, and admin pages
- Dynamic menu loaded from a Flask API
- SQLite database for menu items and customer orders
- Customer order creation with generated order IDs
- Admin dashboard for order management and order status updates
- Admin statistics for total orders, revenue, pending orders, and today's orders
- Responsive frontend using HTML, CSS, and JavaScript
- REST API endpoints for menu, orders, admin orders, and statistics

## Technologies Used

- Python
- Flask
- SQLite
- HTML5
- CSS3
- JavaScript
- REST APIs

## Folder Structure

```text
planet-donuts/
├── app.py
├── requirements.txt
├── templates/
│   ├── index.html
│   ├── menu.html
│   ├── order.html
│   └── admin.html
├── static/
│   ├── css/
│   └── js/
└── data/
    └── donuts.db  # created automatically when the app runs
```

## How to Run Locally

1. Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/planet-donuts.git
cd planet-donuts
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
venv\Scripts\activate
```

On macOS/Linux:

```bash
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run the app:

```bash
python app.py
```

5. Open the website:

```text
http://localhost:5000
```

## Main API Endpoints

| Endpoint | Method | Description |
|---|---:|---|
| `/api/menu` | GET | Returns available menu items |
| `/api/orders` | POST | Creates a customer order |
| `/api/orders/<order_id>` | GET | Retrieves a specific order |
| `/api/admin/orders` | GET | Lists recent orders for admin dashboard |
| `/api/admin/orders/<order_id>/status` | PATCH | Updates order status |
| `/api/admin/stats` | GET | Returns dashboard statistics |

## Screenshots

Add screenshots here after uploading the project to GitHub:

```text
/screenshots/home.png
/screenshots/menu.png
/screenshots/order.png
/screenshots/admin.png
```

## What I Learned

- Designing and connecting backend APIs with frontend pages
- Using SQLite for persistent storage
- Structuring a full-stack Flask project
- Handling customer order validation and admin workflows
- Building a professional project suitable for a portfolio

## Author

Morad Khalil  
Computer Science Student | Backend Developer | AI & Web Developer
