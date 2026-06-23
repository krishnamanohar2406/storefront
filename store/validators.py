from django.core.exceptions import ValidationError

def validate(file):
    max_kb=10000
    if file.size>max_kb*1024:
        raise ValidationError(f"File size should not exceed {max_kb} KB.")
