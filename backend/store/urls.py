from django.urls import path,include
from . import views
from rest_framework.routers import SimpleRouter,DefaultRouter
from  rest_framework_nested.routers import NestedSimpleRouter

router = DefaultRouter()
router.register('products',views.ProductViewSet,basename='product')

router.register('collections', views.CollectionViewSet, basename='collection' )
router.register('carts', views.CartViewSet, basename='cart' )
router.register('customers', views.CustomerViewSet, basename='customer' )
router.register('orders',views.OrderViewSet, basename='order')
router.register('addresses', views.AddressViewSet, basename='address')


productRouter= NestedSimpleRouter(router,"products",lookup="product")
productRouter.register('reviews', views.ReviewSet,basename='product-reviews')

productRouter.register('images', views.ProductImageViewSet, basename='product-images')

cartRouter = NestedSimpleRouter(router,"carts",lookup="cart")
cartRouter.register('items', views.CartItemViewSet, basename='cart-items') 


urlpatterns = router.urls + productRouter.urls+ cartRouter.urls
