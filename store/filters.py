from django_filters import rest_framework as filters
from .models import Product

class ProductFilter(filters.FilterSet):
    class Meta:
        model= Product
        fields = {
            'collection_id': ['exact'],
            'unit_price': ['lt', 'gt'],
        }