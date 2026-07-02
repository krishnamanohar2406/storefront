from django.contrib import admin

# Register your models here.

from django.contrib import admin, messages
from django.db.models.aggregates import Count
from django.db.models.query import QuerySet
from django.utils.html import format_html, urlencode
from django.urls import reverse
from . import models

class InventoryFilter(admin.SimpleListFilter):
    title='inventory'
    parameter_name='inventory'
    def lookups(self, request, model_admin):
        return [('<10','Low')]
    
    def queryset(self, request, queryset: QuerySet):
        if self.value() == '<10':
            return queryset.filter(inventory__lt=10)

class ProductImageInline(admin.TabularInline):
    model=models.ProductImage
    readonly_fields=['thumbnail']
    def thumbnail(self,instance,):
        if instance.image_url:
            return format_html('<img src="{}" class="thumbnail"/>',instance.image.url)
        return ""

@admin.register(models.Product)
class ProductAdmin(admin.ModelAdmin):
    autocomplete_fields=['collection']
    prepopulated_fields={
        'slug':['title']
    }
    actions=['clear_inventory']
    inlines=[ProductImageInline]
    list_display=['title','unit_price','inventory_status','collection_title']
    list_editable=['unit_price']
    list_filter=['collection', 'last_update', InventoryFilter]
    list_per_page = 10
    list_select_related = ['collection']
    search_fields = ['title']

    def collection_title(self,product):
        return product.collection.name
    
    @admin.display(ordering='inventory')
    def inventory_status(self,product):
        if product.inventory<10:
            return 'Low'
        return 'Ok'


    @admin.action(description='clear_inventory')
    def clear_inventory(self,request,queryset):
        updated_count=queryset.update(inventory=0)
        self.message_user(
            request,
            f'{updated_count} products were successfully updated.',
            messages.ERROR
        )

    class Media:
        css = {
            'all': ['store/style.css']
        }



@admin.register(models.Collection)
class CollectionAdmin(admin.ModelAdmin):
    autocomplete_fields = ['featured_product']
    list_display = ['name', 'products_count']
    search_fields = ['name']

    @admin.display(ordering='products_count')
    def products_count(self, collection):
        url = (
            reverse('admin:store_product_changelist')
            + '?'
            + urlencode({
                'collection__id': str(collection.id)
            }))
        return format_html('<a href="{}">{} Products</a>', url, collection.products_count)

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            products_count=Count('products')
        )
    

@admin.register(models.Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name',  'membership', 'orders']
    list_editable = ['membership']
    list_per_page = 10
    list_select_related = ['user']
    ordering = ['user__first_name', 'user__last_name']
    search_fields = ['first_name__istartswith', 'last_name__istartswith']

    @admin.display(ordering='orders_count')
    def orders(self, customer):
        url = (
            reverse('admin:store_order_changelist')
            + '?'
            + urlencode({
                'customer__id': str(customer.id)
            }))
        return format_html('<a href="{}">{} Orders</a>', url, customer.orders_count)

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            orders_count=Count('order')
        )
    

class OrderItemInline(admin.TabularInline):
    model=models.OrderItem
    autocomplete_fields = ['product']
    min_num = 1
    max_num = 10

@admin.register(models.Order)
class OrderAdmin(admin.ModelAdmin):
    autocomplete_fields=['customer']
    inlines = [OrderItemInline]
    list_display = ['id', 'created_at', 'customer', 'payment_status', 'delivered']
    list_editable = ['payment_status', 'delivered']
    list_filter = ['payment_status', 'delivered']
    actions = ['mark_delivered']

    @admin.action(description='Mark selected orders as delivered')
    def mark_delivered(self, request, queryset):
        from django.utils import timezone
        updated_count = queryset.filter(delivered=False).update(delivered=True, delivered_at=timezone.now())
        self.message_user(request, f'{updated_count} orders marked as delivered.')