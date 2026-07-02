# Maison Rosé — Storefront Backend

Django REST Framework API powering the storefront. JWT auth (Djoser +
SimpleJWT), product/collection/cart/order endpoints, and Razorpay payments.

## Setup

```bash
python -m venv .venv && source .venv/bin/activate   # or your preferred env manager
pip install -r requirements.txt

cp .env.example .env
# edit .env with your Razorpay TEST key id/secret from
# https://dashboard.razorpay.com/app/keys

python manage.py migrate
python manage.py createsuperuser   # optional, for /admin/
python manage.py runserver
```

The API runs at `http://localhost:8000`. CORS is already configured to allow
requests from the Vite frontend at `http://localhost:5173` (see
`CORS_ALLOWED_ORIGINS` in `storefront/settings.py` — add more origins there if
you serve the frontend elsewhere).

## Database

`storefront/settings.py` is configured for MySQL. Update the `DATABASES`
block (or switch to env vars, same pattern as the Razorpay keys) if your
local MySQL credentials differ. `mysqlclient` needs MySQL's dev headers
installed at the OS level to build — if `pip install` fails on it, install
`libmysqlclient-dev` (Debian/Ubuntu) or `mysql-devel` (Fedora/RHEL) first.

## Notes for whoever's running this

A handful of bugs were fixed while wiring up the frontend integration —
worth knowing about if you're also working from an older copy of this code:

- `Collection` listing was missing `products_count` annotation (crashed).
- `Cart` lookups for a logged-in customer compared the wrong ID field
  (always 404'd on refresh).
- `Customer.address` on the `/store/customers/me/` serializer pointed at a
  nonexistent attribute (crashed) — now reads the customer's most recent
  saved address safely.
- `Address.state` / `Address.country` existed on the model but were never
  migrated — added in `0011_address_country_address_state_order_shipping_address.py`.
- Reviews: the `product` field was both implicitly required and silently
  duplicated in `Review.objects.create()`, which crashed on save — fixed by
  making it read-only and setting it from the URL, same as `customer`.
- Added `Address` management (`/store/addresses/`) and linked it to `Order`
  via a new `shipping_address` field, since checkout needs somewhere to ship to.

None of this is destructive — it's all either new fields/endpoints or fixes
to things that were silently broken before.
