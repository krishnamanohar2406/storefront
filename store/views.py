# from django.shortcuts import get_object_or_404
# from django.http import HttpResponse
# from rest_framework.decorators import api_view
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet,GenericViewSet
from rest_framework.mixins import ListModelMixin, CreateModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework.decorators import action
# from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter,OrderingFilter

from rest_framework.response import Response

from rest_framework.permissions import IsAdminUser,IsAuthenticated

from store.filters import ProductFilter
from store.models import Cart, CartItem, Customer, Order, Product,Collection, ProductImage, Review
from store.pagination import DefaultPagination
from store.serializers import AddCartItemSerializer, CartItemSerializer, CartSerializer, CollectionSerializer, CreateOrderSerializer, CustomerSerializer, OrderItemSerializer, OrderSerializer, ProductImageSerializer, ProductSerializer ,ReviewSerializer, UpdateCartItemSerializer, UpdateOrderSerializer,RazorpayVerificationSerializer,EmptySerializer

from decimal import Decimal
from django.conf import settings
import razorpay
from store.payments import get_razorpay_client  # <--- CRITICAL FIX


class CustomerViewSet(ModelViewSet):
    queryset=Customer.objects.all()
    serializer_class=CustomerSerializer
    permission_classes=[IsAdminUser]

    @action(detail=False,methods=['GET','PUT'],url_path='me',permission_classes=[IsAuthenticated])
    def me(self,request):
        customer=Customer.objects.get(user_id=request.user.id)
        if request.method == 'GET':
            serializer=CustomerSerializer(customer)
            return Response(serializer.data)
        elif request.method=='PUT':
            serializer=CustomerSerializer(customer, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        

        




class ProductViewSet(ModelViewSet):
    queryset=Product.objects.select_related('collection').all()
    serializer_class=ProductSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['title', 'description']
    ordering_fields = ['unit_price', 'last_update']

    pagination_class=DefaultPagination
    http_method_names=['get','post','put','patch','delete']
    def get_permissions(self):
        if self.request.method in ['POST','PUT','PATCH','DELETE']:
            return [IsAdminUser()]
        return []

    def get_serializer_context(self):
        return {'request': self.request}
    
class CollectionViewSet(ModelViewSet):
    queryset=Collection.objects.all()
    serializer_class=CollectionSerializer
    http_method_names=['get','post','put','patch','delete']
    def get_permissions(self):
        if self.request.method in ['POST','PUT','PATCH','DELETE']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    def get_serializer_context(self):
        return {'request': self.request}



class ProductImageViewSet(ModelViewSet):
    serializer_class=ProductImageSerializer
    http_method_names=['get','post','put','patch','delete']
    def get_permissions(self):
        if self.request.method in ['POST','PUT','PATCH','DELETE']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    def get_serializer_context(self):
        return {'product_id':self.kwargs['product_pk']}
    
    def get_queryset(self):
        return ProductImage.objects.filter(product_id=self.kwargs['product_pk'])
    

    



class ReviewSet(ModelViewSet):
    serializer_class=ReviewSerializer

    def get_serializer_context(self):
        return {'product_id':self.kwargs['product_pk'],'user_id': self.request.user.id}
    
    def get_queryset(self):
        return Review.objects.filter(product_id=self.kwargs['product_pk'])
    


class CartViewSet(ModelViewSet):
    serializer_class=CartSerializer

    http_method_names=['get','post','patch','delete']
    def get_permissions(self):
        if self.request.method in ['PATCH','DELETE']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Cart.objects.all()
        
        
        return Cart.objects.filter(customer_id =self.request.user.id).prefetch_related('items__product').all()
    
    def get_serializer_context(self):
        cxt= super().get_serializer_context()
        cxt['user_id']= self.request.user.id
        return cxt
    
    @action(detail=True, methods=['POST'], url_path='checkout', permission_classes=[IsAuthenticated])
    def checkout(self, request, pk=None):
        cart_id = self.kwargs.get('pk') or pk
        serializer = CreateOrderSerializer(
            data={'cart_id': cart_id},
            context={'user_id': request.user.id, 'cart_id': cart_id},
        )
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data)



class CartItemViewSet(ModelViewSet):
    http_method_names=['get','post','patch','delete']
    def get_serializer_class(self):
        if self.request.method=="POST":
            return AddCartItemSerializer
        elif self.request.method=="PATCH":
            return UpdateCartItemSerializer
        return CartItemSerializer

    def get_queryset(self):
        return CartItem.objects.filter(cart_id=self.kwargs['cart_pk'])
    def get_serializer_context(self):
        return {'cart_id': self.kwargs['cart_pk']}

    

class OrderViewSet(ModelViewSet):
    http_method_names = ['get', 'post', 'patch', 'delete']
    
    def get_permissions(self):
        if self.request.method in ['PATCH', 'DELETE']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        # Bind the specialized structures to your actions to fix the Django REST page layout!
        if self.action == 'make_payment':
            return EmptySerializer
        elif self.action == 'verify_payment':
            return RazorpayVerificationSerializer
            
        if self.request.method == 'POST':
            return CreateOrderSerializer
        elif self.request.method == 'PATCH':
            return UpdateOrderSerializer
        return OrderSerializer

    def get_serializer_context(self):
        return {'user_id': self.request.user.id}

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all()
        customer_id = Customer.objects.only('id').get(user_id=self.request.user.id).id
        return Order.objects.filter(customer_id=customer_id)
        
    @action(detail=True, methods=['POST'], url_path='makepayment', permission_classes=[IsAuthenticated])
    def make_payment(self, request, pk=None):
        order = self.get_object()

        if order.payment_status == Order.PAYMENT_STATUS_COMPLETE:
            return Response({'detail': 'This order has already been paid for.'}, status=status.HTTP_400_BAD_REQUEST)

        total = sum(
            (item.quantity * item.product.unit_price for item in order.items.select_related('product').all()),
            Decimal('0.00')
        )
        if total <= 0:
            return Response({'detail': 'This order has no items to pay for.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if order.razorpay_order_id and order.payment_status == Order.PAYMENT_STATUS_PENDING:
            # Optional: You can choose to return the existing order details directly to save api times
            return Response({
            'order_id': order.id,
            'razorpay_order_id': order.razorpay_order_id,
            
            })

        try:
            razorpay_order = get_razorpay_client().order.create({
                'amount': int(total * 100),  # Razorpay expects paise
                'currency': 'INR',
                'payment_capture': 1,
                'notes': {'order_id': str(order.id)},
            })
        except Exception as e:
            return Response({'detail': f'Could not initiate payment: {e}'}, status=status.HTTP_502_BAD_GATEWAY)

        order.razorpay_order_id = razorpay_order['id']
        order.save()

        return Response({
            'order_id': order.id,
            'razorpay_order_id': order.razorpay_order_id,
            'razorpay_key_id': settings.RAZORPAY_KEY_ID,
            'amount': razorpay_order['amount'],
            'currency': razorpay_order['currency'],
        })

    @action(detail=True, methods=['POST'], url_path='verify-payment', permission_classes=[IsAuthenticated])
    def verify_payment(self, request, pk=None):
        order = self.get_object()

        serializer = RazorpayVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # CRITICAL SECURITY CHECK: Ensure client's order ID matches the database token securely
        if data['razorpay_order_id'] != order.razorpay_order_id:
            return Response({'detail': 'Invalid payment session details.'}, status=status.HTTP_400_BAD_REQUEST)
            

        try:
            get_razorpay_client().utility.verify_payment_signature({
                'razorpay_order_id': order.razorpay_order_id, 
                'razorpay_payment_id': data['razorpay_payment_id'],
                'razorpay_signature': data['razorpay_signature'],
            })
        except razorpay.errors.SignatureVerificationError:
            order.payment_status = Order.PAYMENT_STATUS_FAILED
            order.save()
            return Response({'detail': 'Payment verification failed.'}, status=status.HTTP_400_BAD_REQUEST)

        order.payment_status = Order.PAYMENT_STATUS_COMPLETE
        order.razorpay_payment_id = data['razorpay_payment_id']
        order.save()
        
        return Response(OrderSerializer(order).data)














