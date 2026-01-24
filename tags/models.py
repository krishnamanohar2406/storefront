from django.db import models
# Create your models here.
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
class Tag(models.Model):
    label = models.CharField(max_length=255)

class TaggedItem(models.Model):
    # What tag applied to what object
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    # Type (product, video, article)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_type = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_type')