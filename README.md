# Maison Rosé — Full-stack Storefront

A Django REST Framework backend + React (Vite) frontend for a fashion
e-commerce storefront, with JWT auth and Razorpay payments end-to-end.

```
storefront-fullstack/
├── backend/    Django REST API (see backend/README.md)
└── frontend/   React storefront (see frontend/README.md)
```

## Running both together

You need two terminals — the frontend talks to the backend over HTTP, they
don't share a process.

**Terminal 1 — backend:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # then fill in your Razorpay test keys
python manage.py migrate
python manage.py runserver
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173`. Register an account, browse products
(seed a few via `/admin/` if the catalog is empty), add to bag, and check out.

## How checkout/payment actually flows

1. `POST /store/carts/{cart_id}/checkout/` — creates the `Order` (status:
   Pending), optionally attaching a `shipping_address`.
2. `POST /store/orders/{order_id}/makepayment/` — asks Razorpay for a payment
   order, returns the public key + order id the frontend needs to open
   Razorpay's Checkout widget. Safe to call again if a payment attempt fails.
3. Customer pays in the Razorpay modal.
4. `POST /store/orders/{order_id}/verify-payment/` — verifies the payment
   signature server-side and flips `payment_status` to Complete.

The frontend's `CheckoutPage` and `OrderDetailPage` (for retrying a failed
payment) both implement this sequence — see `frontend/src/pages/`.

## Before you ship this anywhere public

- Move `SECRET_KEY` and the MySQL password in `backend/storefront/settings.py`
  into `.env` the same way the Razorpay keys are — they're still hardcoded.
- Turn `DEBUG = False` and remove `django-debug-toolbar` for production.
- Switch Razorpay to live keys only once you've tested the full flow in Test
  Mode.
