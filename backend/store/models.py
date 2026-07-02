from django.db import models
from django.contrib import admin
from django.conf import settings
from uuid import uuid4
from django.core.validators import MinValueValidator, FileExtensionValidator
from django.utils.text import slugify         

from store.validators import validate



class Customer(models.Model):
    MEMBERSHIP_BRONZE = 'B'
    MEMBERSHIP_SILVER = 'S'
    MEMBERSHIP_GOLD = 'G'

    MEMBERSHIP_CHOICES = [
        (MEMBERSHIP_BRONZE, 'Bronze'),
        (MEMBERSHIP_SILVER, 'Silver'),
        (MEMBERSHIP_GOLD, 'Gold'),
    ]

    phone = models.CharField(max_length=255)
    birth_date = models.DateField(null=True)
    membership = models.CharField(
        max_length=1, choices=MEMBERSHIP_CHOICES, default=MEMBERSHIP_BRONZE)
    
    user=models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    def __str__(self):
        return f'{self.user.first_name} {self.user.last_name}'
    
    @admin.display(ordering='user__first_name')
    def first_name(self):
        return self.user.first_name
    
    @admin.display(ordering='user__last_name')
    def last_name(self):
        return self.user.last_name
    
    class Meta:
        ordering = ['user__first_name', 'user__last_name']

class Promotion(models.Model):
    description = models.CharField(max_length=255)
    discount = models.FloatField()


class Collection(models.Model):
    GENDER_CHOICES = [
        ('men', 'Men'),
        ('women', 'Women'),
        ('unisex', 'Unisex'),
        ('kids', 'Kids'),
    ]
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True,blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='unisex')
    featured_product = models.ForeignKey(
        'Product', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='+'
    )

    def __str__(self):
        return self.name


class Product(models.Model):
    # ---------- Core Fields ----------
    asin         = models.CharField(max_length=50, unique=True, null=True, blank=True)  # Amazon ID, prevents duplicates
    title        = models.CharField(max_length=255)
    slug = models.SlugField(unique=True,blank=True)
    description  = models.TextField(null=True, blank=True)

    # ---------- Pricing ----------
    unit_price    = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(1)])
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # for showing discounts

    # ---------- Inventory ----------
    inventory    = models.IntegerField(default=0)
    is_active    = models.BooleanField(default=True)  # hide out-of-stock products

    # ---------- Fashion Specific ----------
    brand        = models.CharField(max_length=100, null=True, blank=True)
    sizes        = models.JSONField(default=list, blank=True)   # ["S","M","L","XL"] or ["6","7","8"] for shoes
    colors       = models.JSONField(default=list, blank=True)   # ["Red","Blue","Black"]
    material     = models.CharField(max_length=100, null=True, blank=True)  # Cotton, Leather, etc.

    # ---------- Amazon Source ----------
    product_url  = models.URLField(max_length=1000, blank=True)
    avg_rating   = models.FloatField(default=0)     # from Amazon
    num_ratings  = models.IntegerField(default=0)   # from Amazon

    # ---------- Relations ----------
    collection   = models.ForeignKey(Collection, on_delete=models.PROTECT, related_name='products')
    promotion    = models.ManyToManyField('Promotion', blank=True)

    # ---------- Timestamps ----------
    last_update  = models.DateTimeField(auto_now=True)        # ✅ auto_now updates on every save
    created_at   = models.DateTimeField(auto_now_add=True,null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['collection']),
            models.Index(fields=['unit_price']),
        ]

    def save(self, *args, **kwargs):
        # auto-generate slug from title
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug[:50]
            counter=1
            if len(slug)>49:
                while Product.objects.filter(slug=slug+str(counter)).exists():
                    counter+=1
                self.slug=slug+str(counter)
            else:
                while Product.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                self.slug = slug
        super().save(*args, **kwargs)

    @property
    def discount_percent(self):
        """Shows how much % off the original price"""
        if self.original_price and self.original_price > self.unit_price:
            return round((1 - self.unit_price / self.original_price) * 100)
        return 0

    def __str__(self):
        return self.title


class ProductImage(models.Model):
    product   = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    # image     = models.ImageField(upload_to='store/images/', null=True, blank=True)  # for manual uploads
    image_url = models.URLField(max_length=1000, null=True, blank=True)             # ✅ for Amazon API images
    is_primary = models.BooleanField(default=False)  # marks the main display image

    def __str__(self):
        return f"Image for {self.product.title}"


class Review(models.Model):
    RATING_CHOICES = [
        (1, '⭐ Very Bad'),
        (2, '⭐⭐ Bad'),
        (3, '⭐⭐⭐ Average'),
        (4, '⭐⭐⭐⭐ Good'),
        (5, '⭐⭐⭐⭐⭐ Excellent'),
    ]

    product     = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    customer    = models.ForeignKey('Customer', on_delete=models.PROTECT)
    rating      = models.SmallIntegerField(choices=RATING_CHOICES)
    description = models.TextField(null=True, blank=True)
    # is_verified = models.BooleanField(default=False)  # verified purchase
    created_at  = models.DateTimeField(auto_now_add=True)  # ✅ DateTimeField not DateField

    class Meta:
        # one review per customer per product
        unique_together = [['product', 'customer']]

    def __str__(self):
        return f"{self.customer} rated {self.product.title} — {self.rating}⭐"


class Order(models.Model):
    PAYMENT_STATUS_PENDING = 'P'
    PAYMENT_STATUS_COMPLETE = 'C'
    PAYMENT_STATUS_FAILED = 'F'
    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_STATUS_PENDING, 'Pending'),
        (PAYMENT_STATUS_COMPLETE, 'Complete'),
        (PAYMENT_STATUS_FAILED, 'Failed')
    ]
    id= models.UUIDField(primary_key=True, default=uuid4, editable=False)
    created_at=models.DateTimeField(auto_now_add=True)
    payment_status=models.CharField(max_length=50, choices=PAYMENT_STATUS_CHOICES, default=PAYMENT_STATUS_PENDING)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT)
    delivered = models.BooleanField(default=False)
    delivered_at = models.DateTimeField(null=True, blank=True)
    razorpay_order_id = models.CharField(max_length=100, null=True, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, null=True, blank=True)
    shipping_address = models.ForeignKey('Address', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')


class OrderItem(models.Model):
    order=models.ForeignKey(Order,on_delete=models.PROTECT,related_name='items')
    product=models.ForeignKey(Product,on_delete=models.PROTECT,related_name='orderitems')
    quantity = models.PositiveSmallIntegerField()
    

class Address(models.Model):
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    state=models.CharField(max_length=100)
    country=models.CharField(max_length=100)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)




class Cart(models.Model):

    id= models.UUIDField(primary_key=True, default=uuid4, editable=False)
    created_at=models.DateTimeField(auto_now_add=True)
    customer=models.ForeignKey(Customer,on_delete=models.CASCADE)




class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE , related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveSmallIntegerField( validators=[MinValueValidator(0)])
    class Meta:
        unique_together = [['cart', 'product']]


    