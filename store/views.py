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
from rest_framework.response import Response  
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter,OrderingFilter
from rest_framework.permissions import AllowAny, DjangoModelPermissions, IsAdminUser, IsAuthenticated

from store.permissions import FullDjangoModelPermissions, IsAdminOrReadOnly, ViewCustomerHistoryPemission
from .filters import ProductFilter
from .pagination import DefaultPagination
from .models import Cart, CartItem, Order, Product,Collection,OrderItem, Reviews, Customer
from django.db.models import Count

from .serializers import CartItemSerializer, CartSerializer, CreateOrderSerializer, OrderSerializer, ProductSerializer, UpdateOrderSerializer , collectionSerializer,ReviewSerialzer, AddCartItemSerializer,UpdateCartItemSerializer, CustomerSerializer
# Create your views here.

# -----------------1-----------------1------------------1--------------
# @api_view(['GET'])
# def product_list(request):
#     query_set = Product.objects.select_related('collection').all()
#     ser = ProductSerializer(query_set, many=True, context={'request': request})
#     return Response(ser.data)

# @api_view(['GET'])
# def product_detail(request,id):

#     product = get_object_or_404(Product, id=id)
#     ser = ProductSerializer(product)
#     return Response(ser.data)
#     # try:
#     #     # product = Product.objects.filter(id=id).values('id', 'title', 'unit_price').first()
#     #     product = Product.objects.get(id=id)
#     #     ser = ProductSerializer(product)
#     #     return Response(ser.data)
#     # except Product.DoesNotExist:
#     #     return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)         
#     # return Response(f"Product detail view for product id  {id} ")



# # ----------------2----------------2----------------------2---
# class ProductList(APIView):
#     def get(self,request):
#         query_set = Product.objects.select_related('collection').all()
#         ser = ProductSerializer(query_set, many=True, context={'request': request})
#         return Response(ser.data)
#     def post(self,request):
#         serializer = ProductSerializer(data=request.data)
         
#         serializer.is_valid(raise_exception=True)
#         serializer.save()
#         return Response(serializer.data, status=status.HTTP_201_CREATED)



# 3--------------3----------------------3----------------------3---
# class ProductList(ListCreateAPIView):
#     def get_queryset(self):
#         # return super().get_queryset()
#         return Product.objects.select_related('collection').all()
#     def get_serializer_class(self):
#         return ProductSerializer

#     def get_serializer_context(self):
#         return {'request': self.request}


# class ProductDetail(RetrieveUpdateDestroyAPIView):
#     queryset = Product.objects.all()
#     serializer_class = ProductSerializer
#     def delete(self,request,id):
#         product = get_object_or_404(Product, id=id)
#         product.delete()
#         return Response(status=status.HTTP_204_NO_CONTENT)
    


# # ------------4---------------4-------------------------------4
class ProductViewSet(ModelViewSet):#combination of product list and product detail
    # queryset = Product.objects.all()
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]#used to filter based on foreign key without requiring to implement get_gueryset manually
    # filterset_fields = ['collection_id','unit_price']

    permission_classes=[IsAdminOrReadOnly]

    filterset_class = ProductFilter
    search_fields = ['title', 'description']
    ordering_fields = ['unit_price', 'last_update']

    # pagination_class = PageNumberPagination
    # page_size= 10
    pagination_class=DefaultPagination

    # def get_queryset(self):
    #     query_set=Product.objects.all()
    #     collection_id=self.request.query_params.get('collection_id')
    #     if collection_id is not None:
    #         query_set=query_set.filter(collection_id=collection_id)
    #     return query_set

    def get_serializer_context(self):
        return {'request': self.request}

    # def delete(self,request,id):
    #     product = get_object_or_404(Product, id=id)
    #     product.delete()
    #     return Response(status=status.HTTP_204_NO_CONTENT)

    # def destroy(self, request, *args, **kwargs):
    #     if OrderItem.objects.filter(product_id=kwargs['pk']).count()>0:
    #         return Response({'error':'Product cannot be deleted because it is having orders count>0'})
    #     return super().destroy(request, *args, **kwargs)




# class ProductDetail(APIView):
#     def get(self,request,id):
#         product = get_object_or_404(Product, id=id)
#         ser = ProductSerializer(product)
#         return Response(ser.data)
    
#     def put(self,request,id):
#         product = get_object_or_404(Product, id=id)
#         serializer = ProductSerializer(product, data=request.data)
#         serializer.is_valid(raise_exception=True)
#         serializer.save()
#         return Response(serializer.data)
    
#     def delete(self,request,id):
#         product = get_object_or_404(Product, id=id)
#         product.delete()
#         return Response(status=status.HTTP_204_NO_CONTENT)
    




#
#---------------------Collection-Views--------------------------------
#

# ----------------------1----------1-------------1-----------------------
# @api_view(['GET','POST'])
# def collection_list(request):
#     if request.method=='GET':
#         collection=Collection.objects.annotate(products_count=Count('product')).all()
#         # print(collection)
#         ser=collectionSerializer(collection,many=True)
#         return Response(ser.data)
#         # return Response(f"Collection detail view for collection id  {id} ")
#     elif request.method=='POST':
#         serializer = collectionSerializer(data=request.data)
         
#         serializer.is_valid(raise_exception=True)
#         serializer.save()
#         return Response(serializer.data, status=status.HTTP_201_CREATED)
    
# @api_view(['GET', 'PUT', 'DELETE'])
# def collection_detail(request,pk):
#     collection=get_object_or_404(Collection.objects.annotate(products_count=Count('product')), pk=pk)
#     if request.method=='GET':
#         # collection = get_object_or_404(Collection, pk=id)
#         ser = collectionSerializer(collection)
#         return Response(ser.data)
#     elif request.method=='PUT':
#         # collection = get_object_or_404(Collection, pk=id)
#         serializer = collectionSerializer(collection, data=request.data)
#         serializer.is_valid(raise_exception=True)
#         serializer.save()
#         return Response(serializer.data)
#     elif request.method=='DELETE':
#         if collection.product_set.count()>0:
#             return Response({'error':'Collection cannot be deleted because it includes one or more products.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
#         collection.delete()


# ------------------------2--------------------2-----------------2-------
# class CollectionList(ListCreateAPIView):
#     def get_queryset(self):
#         return Collection.objects.annotate(products_count=Count('product')).all()
#     def get_serializer_class(self):
#         return collectionSerializer
    
# ------------------------3---------------------------3-------------3----
# class CollectionViewSet(ReadOnlyModelViewSet): ------> for only read operations not able to delete orupdate


class CollectionViewSet(ModelViewSet):
    queryset = Collection.objects.all()
    serializer_class = collectionSerializer

    permission_classes=[IsAdminOrReadOnly]

    def get_serializer_context(self):
        return {'request': self.request}
    

    # def delete(self,request,pk):
    #     collection = get_object_or_404(Collection, pk=pk)
    #     if collection.product_set.count()>0:
    #         return Response({'error':'Collection cannot be deleted because it includes one or more products.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
    #     collection.delete()
    #     return Response(status=status.HTTP_204_NO_CONTENT)
    # error below code
    # def destory(self,request,*args, **kwargs):
    #     if Product.objects.filter(collection_id=kwargs['pk']).count()>0:
    #         return Response({'error':'collection cannot be deleted because it is containing products in that collection'})
    #     return super().destroy(request, *args, **kwargs)
    def destroy(self, request, *args, **kwargs):
        if Product.objects.filter(collection_id=kwargs['pk']).count()>0:
            return Response({'error':'collection cannot be deleted because it is having product count>0'})
        return super().destroy(request, *args, **kwargs)
    

class ReviewSet(ModelViewSet):
    serializer_class=ReviewSerialzer
    def get_queryset(self):
        return Reviews.objects.filter(product_id=self.kwargs['product_pk'])

    def get_serializer_context(self):
        return {'product_id': self.kwargs['product_pk']}
    


class CartViewSet(CreateModelMixin, GenericViewSet, ListModelMixin,RetrieveUpdateDestroyAPIView):
    queryset=Cart.objects.prefetch_related('items__product').all()
    serializer_class=CartSerializer


class CartItemViewSet(ModelViewSet):
    # serializer_class=CartItemSerializer
    http_method_names=['get','post','patch','delete']#explicitly mention allowed http methods
    def get_serializer_class(self):
        if self.request.method=="POST":
            return AddCartItemSerializer
        elif self.request.method=="PATCH":
            return UpdateCartItemSerializer
        return CartItemSerializer

    def get_queryset(self):
        return CartItem.objects.filter(cart_id=self.kwargs['cart_pk'])\
        .select_related('product')
    def get_serializer_context(self):
        return {'cart_id': self.kwargs['cart_pk']}




class CustomerViewSet(ModelViewSet):


    queryset=Customer.objects.all()
    serializer_class=CustomerSerializer
    perimissions_classes=[IsAdminUser]
    # permission_classes=[FullDjangoModelPermissions]
    # permission_classes=[DjangoModelPermissionsOrAnonReadOnly].

    # def get_permissions(self):
    #     if self.request.method=='GET':
    #         return [AllowAny()]
    #     return [IsAuthenticated()]

    
    @action(detail=False, methods=['GET','PUT'], url_path='me', permission_classes=[IsAuthenticated])
    def me(self,request):
        customer=Customer.objects.get(user_id=request.user.id)
        if request.method=='GET':
            serializer=CustomerSerializer(customer)
            return Response(serializer.data)
        elif request.method=='PUT':
            serializer=CustomerSerializer(customer, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        

    @action(detail=True, permission_classes=[ViewCustomerHistoryPemission])
    def history(self,request,pk):
        return Response('ok')
    

class OrderViewSet(ModelViewSet):
    # queryset=Order.objects.all()
    # serializer_class=OrderSerializer
    http_method_names=['get','post','patch','delete']
    def get_permissions(self):
        if self.request.method in ['PATCH','DELETE']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    # permission_classes=[IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer=CreateOrderSerializer(data=request.data, context={'user_id': request.user.id})
        serializer.is_valid(raise_exception=True)
        order=serializer.save()
        order_serializer=OrderSerializer(order)
        return Response(order_serializer.data, status=status.HTTP_201_CREATED)



    def get_serializer_class(self):
        if self.request.method=='POST':
            return CreateOrderSerializer
        elif self.request.method=='PATCH':
            return UpdateOrderSerializer
        return OrderSerializer

    def get_serializer_context(self):
        return {'user_id': self.request.user.id}

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all()
        
        customer_id = Customer.objects.only('id').get(user_id=self.request.user.id)
        return Order.objects.filter(customer_id=customer_id)
        # Order.objects.filter(customer_id = customer__user_id=self.request.user.id)