from django.shortcuts import render
from django.http import HttpResponse
from store.models import Product, OrderItem,Order, Customer
from tags.models import TaggedItem    
from django.core.exceptions import ObjectDoesNotExist            
from django.db.models import Q, Count

from django.contrib.contenttypes.models import ContentType
from store.models import Product
# Create your views here.
# This is a placeholder view for the playground app.
#request-> response
#rewuest handler
#action
def calculate():
    x=1
    y=2
    return x

def sayhello(request):
    #pull data from db
    #process data / business logic
    # #send email
    # try:
    #     product=Product.objects.get(pk=1)
    #     # print(product)
    # except ObjectDoesNotExist:
    #     product=None
    # query_set=Product.objects.order_by('price','title')
    # contet_type=ContentType.objects.get_for_model(Product)
    # query_set=TaggedItem.objects.select_related('tag').filter(content_type=contet_type, )
    # query_set=Customer.objects.annotate(Count('order'))
    query_set=Product.objects.filter(id__in=OrderItem.objects.values('product_id')).order_by('title')
    # query_set=OrderItem.objects.values('product_id')
    # query_set=Product.objects.filter(collection__id__range=(15,20))
    # for product in range(5):
    #     print(query_set[product])
    # x= calculate()  
    return render(request, 'hello.html',{'name': 'Django','products': list(query_set)})
    # return HttpResponse("Hello World!")