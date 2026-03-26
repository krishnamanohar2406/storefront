from rest_framework import serializers
from decimal import Decimal
from django.db import transaction
from .models import Order, OrderItem, Product,Collection, ProductImage, Reviews, Cart, CartItem, Customer

from .signals import order_created

class collectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ['id', 'title','products_count']
    products_count = serializers.IntegerField(read_only=True)


class ProductImageSerializer(serializers.ModelSerializer):
    def create(self,validated_data):
        product_id= self.context['product_id']
        return ProductImage.objects.create(product_id=product_id, **validated_data)    

    class Meta:
        model=ProductImage
        fields=['id','image']


class ProductSerializer(serializers.ModelSerializer):
    images=ProductImageSerializer(many=True, read_only=True)
    class Meta:
        model = Product
        fields = ['id', 'title', 'unit_price', 'collection', 'price_with_tax','description', 'inventory','images'] 


    # id = serializers.IntegerField()
    # title = serializers.CharField(max_length=255)
    # price = serializers.DecimalField(max_digits=10, decimal_places=2,source='unit_price')

    price_with_tax = serializers.SerializerMethodField(method_name='calculate_tax')

    # # collection = collectionSerializer()
    # # collection= serializers.PrimaryKeyRelatedField(queryset=Collection.objects.all())

    # collection = serializers.HyperlinkedRelatedField(queryset=Collection.objects.all(), view_name='collection-detail')

    def calculate_tax(self, product : Product):
        return product.unit_price * Decimal(1.1)
    
class ReviewSerialzer(serializers.ModelSerializer):
    class Meta:
        model = Reviews
        fields = ['id','name','description','date']
    
    def create (self, validated_data):
        product_id = self.context['product_id']
        return Reviews.objects.create( product_id=product_id, **validated_data)
    



class SimpleProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id','title','unit_price']





    
class CartItemSerializer(serializers.ModelSerializer):
    product= SimpleProductSerializer(read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id','product','quantity', 'total_price']


    total_price= serializers.SerializerMethodField(method_name='get_total_price')
    def get_total_price (self, cart_item: CartItem):
        return cart_item.quantity * cart_item.product.unit_price
    

class CartSerializer(serializers.ModelSerializer):
    id=serializers.UUIDField(read_only=True)
    items= CartItemSerializer(many=True, read_only=True)
    class Meta :
        model = Cart
        fields = ['id','items','total_bill_price']
    total_bill_price= serializers.SerializerMethodField(method_name='get_total_bill_price')
    def get_total_bill_price (self, cart: Cart):
        query=cart.items.select_related('product').all()
        total= sum([item.quantity * item.product.unit_price for item in query])
        return total




class AddCartItemSerializer(serializers.ModelSerializer):
    product_id= serializers.IntegerField()
    
    def validate_product_id (self, value):
        if not Product.objects.filter( pk=value).exists():
            raise serializers.ValidationError('No product with the given id was found.')
        return value
    # def validate_quantity(self,value):
    #     if value>20:
    #         raise serializers.ValidationError('out of stock')
    #     return value
    def save (self, **kwargs):
        cart_id= self.context['cart_id']
        product_id= self.validated_data['product_id']
        quantity= self.validated_data['quantity']

        try:
            cart_item= CartItem.objects.get(cart_id=cart_id, product_id=product_id)
            cart_item.quantity += quantity
            cart_item.save()
            self.instance= cart_item
        except CartItem.DoesNotExist:
            self.instance= CartItem.objects.create(cart_id=cart_id, **self.validated_data)
        return self.instance
    class Meta:
        model = CartItem
        fields = ['id','product_id','quantity']


class UpdateCartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ['quantity']



class CustomerSerializer(serializers.ModelSerializer):
    user_id= serializers.IntegerField()

    class Meta:
        model = Customer 
        fields = ['id', 'user_id', 'phone', 'birth_date', 'membership']



class OrderItemSerailizer(serializers.ModelSerializer): 
    product= SimpleProductSerializer(read_only=True) 
    class Meta:
        model= OrderItem
        fields=['id','product','quantity','unit_price']

class OrderSerializer(serializers.ModelSerializer):
    items=OrderItemSerailizer(many=True, read_only=True)
    class Meta:
        model=Order
        fields= ['id', 'customer_id', 'placed_at', 'payment_status','items']

class UpdateOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model=Order
        fields= ['payment_status']

class CreateOrderSerializer(serializers.Serializer):
    cart_id= serializers.UUIDField()

    

    def validate_cart_id(self, value):
        if not Cart.objects.filter(pk=value).exists():
            raise serializers.ValidationError('No cart with the given id was found.')   
        if CartItem.objects.filter(cart_id=value).count()==0:
            raise serializers.ValidationError('The cart is empty.')
        return value

    def save(self,**kwargs):
        with transaction.atomic():
            customer=Customer.objects.get(user_id=self.context['user_id'])
            cart_id= self.validated_data['cart_id']

            order= Order.objects.create(customer=customer)

            cart_items=CartItem.objects\
                .select_related('product')\
                .filter(cart_id=cart_id)

            order_items=[OrderItem(order=order,
                    product=item.product,
                    unit_price=item.product.unit_price,
                        quantity=item.quantity
                    )for item in cart_items]
            OrderItem.objects.bulk_create(order_items)

            Cart.objects.filter(pk=cart_id).delete()


            order_created.send_robust(self.__class__, order=order)

            return order
        

