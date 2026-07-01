
from rest_framework import serializers
from decimal import Decimal
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import  Address, Cart, CartItem, Customer, Order, OrderItem, Product,Collection, ProductImage, Review
from django.core.files.storage import default_storage

from .signals import order_created


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model=Address
        fields='__all__'


class CustomerSerializer(serializers.ModelSerializer):
    user_id= serializers.IntegerField()

    address=AddressSerializer()
    class Meta:
        model = Customer 
        fields = ['id', 'user_id', 'phone', 'birth_date', 'membership','address']


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model=Collection
        fields = ['id', 'name','gender','products_count']
    products_count = serializers.IntegerField(read_only=True)


class ProductImageSerializer(serializers.ModelSerializer):
    def create(self,validated_data):
        product_id=self.context['product_id']
        return ProductImage.objects.create(product_id=product_id,**validated_data)
    

    class Meta:
        model=ProductImage
        fields=['id','image_url']


class ProductSerializer(serializers.ModelSerializer):
    images=ProductImageSerializer(many=True)
    class Meta:
        model=Product
        fields=['id','title','description','unit_price','inventory','brand','sizes','colors','material','collection','images']
    def create(self, validated_data):
        images_data=validated_data.pop('images',[])
        product=Product.objects.create(**validated_data)
        for image_data in images_data:
            ProductImage.objects.create(product=product,**image_data)
        return product

class ReviewSerializer(serializers.ModelSerializer):
    def create(self,validated_data):
        product_id=self.context['product_id']
        customer=Customer.objects.get(user_id=self.context['user_id'])
        return Review.objects.create(product_id=product_id,customer=customer,**validated_data)
    
    class Meta:
        model=Review 
        fields=['id','customer','product','rating','description']
        read_only_fields=['customer']

class SimpleProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id','title','unit_price']


class OrderItemSerializer(serializers.ModelSerializer):
    product=SimpleProductSerializer(read_only=True)

    class Meta:
        model=OrderItem
        fields=['id','order','product','quantity','unit_price']
        read_only_fields=['unit_price']
    unit_price=serializers.SerializerMethodField(method_name='cal_price')
    def cal_price(self,orderItem: OrderItem):
        return round(orderItem.product.unit_price*orderItem.quantity,2)


class OrderSerializer(serializers.ModelSerializer):
    items=OrderItemSerializer(many=True,read_only=True)

    class Meta:
        model=Order
        fields = ['id', 'customer', 'created_at', 'payment_status', 'delivered', 'delivered_at', 'razorpay_order_id', 'razorpay_payment_id', 'items']
        read_only_fields=['customer','delivered_at','razorpay_order_id','razorpay_payment_id']

class EmptySerializer(serializers.Serializer): 
    pass

# Create your verification structure data validator 
class RazorpayVerificationSerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField(required=True)
    razorpay_payment_id = serializers.CharField(required=True)
    razorpay_signature = serializers.CharField(required=True)


class UpdateOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model=Order
        fields= ['payment_status','delivered']

    def save(self, **kwargs):
        if 'delivered' in self.validated_data:
            if self.validated_data['delivered'] and not self.instance.delivered:
                from django.utils import timezone
                self.instance.delivered_at = timezone.now()
            elif not self.validated_data['delivered']:
                self.instance.delivered_at = None
        return super().save(**kwargs)



class CartItemSerializer(serializers.ModelSerializer):
    product=SimpleProductSerializer(read_only=True)
    class Meta:
        model=CartItem
        fields=['id','product','quantity','total_price']
    total_price=serializers.SerializerMethodField(method_name='get_total_price')
    def get_total_price(self,cartItem:CartItem):
        return cartItem.quantity*cartItem.product.unit_price
    


class CartSerializer(serializers.ModelSerializer):
    id=serializers.UUIDField
    items=CartItemSerializer(many=True,read_only=True)
    class Meta:
        model=Cart
        fields=['id','items','customer','total_bill']
        read_only_fields=['customer']
    total_bill=serializers.SerializerMethodField(method_name='get_total_price')
    def get_total_price(self,cart:Cart):
        query=cart.items.select_related('product').all()
        return sum([item.quantity * item.product.unit_price for item in query])
    def create(self,validated_data):
        customer = Customer.objects.get(user_id=self.context["user_id"])
        
        return Cart.objects.create(customer=customer, **validated_data)



class AddCartItemSerializer(serializers.ModelSerializer):
    product_id=serializers.IntegerField()
    def validate_product_id(self,value):
        if not Product.objects.filter(pk=value).exists():
            raise serializers.ValidationError('No error with given id found')
        return value

    def save(self, **kwargs):
        cart_id=self.context['cart_id']
        product_id=self.validated_data['product_id']
        quantity= self.validated_data['quantity']
        if quantity==0:
            CartItem.objects.filter(cart_id=cart_id,product_id=product_id).delete()
            return CartItem.objects.filter(cart_id=cart_id).all()
    
        try:
            cart_item=CartItem.objects.get(cart_id=cart_id,product_id=product_id)
            cart_item.quantity=quantity
            
            cart_item.save()
            self.instance= cart_item
        except CartItem.DoesNotExist:
            self.instance=CartItem.objects.create(cart_id=cart_id,**self.validated_data)
        return self.instance


    class Meta:
        model=CartItem
        fields=['id','product_id','quantity']


class UpdateCartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ['quantity']

    def save(self, **kwargs):
        cart_id = self.context.get('cart_id')
        product_id = self.instance.product_id  # ✅ Get directly from the CartItem instance
        quantity = self.validated_data['quantity']
        
        if quantity == 0:
            CartItem.objects.filter(cart_id=cart_id, product_id=product_id).delete()
            return None
        
        return super().save(**kwargs)


class CreateOrderSerializer(serializers.Serializer):
    cart_id = serializers.UUIDField(required=False, allow_null=True)
    product_id = serializers.IntegerField(required=False, min_value=1)
    quantity = serializers.IntegerField(required=False, min_value=1)

    def validate(self, attrs):
        cart_id = attrs.get("cart_id")
        product_id = attrs.get("product_id")
        quantity = attrs.get("quantity")

        if cart_id:
            if not Cart.objects.filter(pk=cart_id, customer__user_id=self.context['user_id']).exists():
                raise serializers.ValidationError({"cart_id": "No cart with the given id was found."})
            if not CartItem.objects.filter(cart_id=cart_id).exists():
                raise serializers.ValidationError({"cart_id": "The cart is empty."})
            return attrs

        if product_id is None or quantity is None:
            raise serializers.ValidationError(
                "Provide either cart_id or both product_id and quantity."
            )

        try:
            attrs["product"] = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            raise serializers.ValidationError({"product_id": "No product with the given id was found."})

        return attrs

    def save(self, **kwargs):
        with transaction.atomic():
            customer = Customer.objects.get(user_id=self.context["user_id"])
            cart_id = self.validated_data.get("cart_id")

            order = Order.objects.create(customer=customer)

            if cart_id:
                cart_items = CartItem.objects.select_related("product").filter(cart_id=cart_id)
                order_items = [
                    OrderItem(
                        order=order,
                        product=item.product,
                        quantity=item.quantity,
                    )
                    for item in cart_items
                ]
                Cart.objects.filter(pk=cart_id).delete()
            else:
                product = self.validated_data["product"]
                order_items = [
                    OrderItem(
                        order=order,
                        product=product,
                        quantity=self.validated_data["quantity"],
                    )
                ]

            OrderItem.objects.bulk_create(order_items)

            order_created.send_robust(self.__class__, order=order)

            return order
    
