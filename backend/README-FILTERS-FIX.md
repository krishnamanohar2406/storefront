# Django REST Framework Filters – Fix Summary

## Symptoms
DjangoFilterBackend / SearchFilter / OrderingFilter appear to have no effect on the `/store/products/` endpoint.

## Primary causes in this repo
1. `django-filter` integration is not configured in `REST_FRAMEWORK` settings.
2. (Common confusion) `Product.last_update` is `DateField(auto_now_add=True)`, so ordering may look unchanged if values are identical or coarse.

## Required fixes
### 1) Ensure `django-filter` is installed
```bash
pip install django-filter
```

### 2) Add `REST_FRAMEWORK` configuration in `storefront/settings.py`
Add this block to `storefront/settings.py`:

```py
REST_FRAMEWORK = {
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ]
}
```

## Quick test URLs
- Filter by collection (exact):
  - `/store/products/?collection_id=1`
- Search:
  - `/store/products/?search=some-text`
- Ordering:
  - `/store/products/?ordering=unit_price`
  - `/store/products/?ordering=-unit_price`

## Note on filterset fields
`ProductFilter` currently allows:
- `collection_id` exact
- `unit_price` lt / gt

Other query params won’t work unless added to `ProductFilter`.

