from store.signals import order_created
from django.db.models.signals import post_save
from django.dispatch import receiver

receiver(post_save, sender=order_created)
def order_created_handler(sender, **kwargs):
    order_id = kwargs['order']
    print(f'Order with id {order_id} has been created.')