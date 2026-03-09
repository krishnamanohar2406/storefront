from django.urls import path,include
from . import views
# from django 
from rest_framework.routers import SimpleRouter,DefaultRouter
from  rest_framework_nested.routers import NestedSimpleRouter
# from pprint import pprint

router = DefaultRouter()
router.register('products', views.ProductViewSet, basename='product')
router.register('collections', views.CollectionViewSet, basename='collection' )
router.register('carts', views.CartViewSet, basename='cart' )
router.register('customers', views.CustomerViewSet, basename='customer' )
router.register('orders',views.OrderViewSet, basename='order')


productRouter= NestedSimpleRouter(router,"products",lookup="product")
productRouter.register('reviews', views.ReviewSet,basename='product-reviews')

cartRouter = NestedSimpleRouter(router,"carts",lookup="cart")
cartRouter.register('items', views.CartItemViewSet, basename='cart-items') 
# # pprint(router.urls)

# -------1--------------1----------1-----------
# urlpatterns = [
#     path('products/', views.ProductList.as_view()),
    # path('products/<int:id>/', views.ProductDetail.as_view()),
    # path('collections/', views.CollectionList.as_view()),
    # path('collections/<int:pk>/', views.collection_detail, name='collection-detail'),
# ]


# -----------2------------------2----------------2-----------
urlpatterns = router.urls + productRouter.urls+ cartRouter.urls

# for urls in urlpatterns:
#     print(urls)

# -----------------3--------------------3----------------------3---------
# urlpatterns = [
#     path('',include(router.urls)),
#     # other paths with router
# ]
