# Maison Rosé — Storefront Frontend

A React + Vite storefront for the Maison Rosé Django backend, styled in a
fashion-editorial direction (warm paper background, deep berry accent,
Fraunces + Inter type pairing).

## Setup

```bash
npm install
cp .env.example .env   # already done for you; edit if your backend runs elsewhere
npm run dev
```

The dev server runs at `http://localhost:5173`. It expects the backend at the
URL set in `.env` (`VITE_API_BASE_URL`, defaults to `http://localhost:8000`).

**The backend must be running first** — see `../backend/README.md`. Make sure
its CORS settings allow `http://localhost:5173` (already configured for you).

## What's wired up

- **Auth**: register / log in via the backend's JWT endpoints. Tokens are
  stored in `localStorage` and auto-refreshed on expiry.
- **Browsing**: collections, products (search, price filter, sort, pagination),
  product detail with reviews.
- **Cart**: persisted per-account; requires login (this backend doesn't support
  anonymous carts).
- **Checkout**: pick/add a delivery address, place the order, pay via
  Razorpay Checkout, and the order's payment status is confirmed automatically.
- **Orders**: order history, order detail, and a "Pay now" retry button for
  any order that's still Pending or Failed.
- **Account**: profile fields (phone, date of birth) and a saved-address book.

## Build for production

```bash
npm run build
```

Outputs to `dist/`. Update `VITE_API_BASE_URL` to your deployed backend's URL
before building if it's not `localhost:8000`.
