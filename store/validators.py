
from django.core.exceptions import ValidationError

def validate(file):
    max_size_kb=5000

    if file.size > max_size_kb * 1024:
        raise ValidationError(f"File size should not exceed {max_size_kb} KB.")