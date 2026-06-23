import requests
import time
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from store.models import Product, Collection, ProductImage

RAPIDAPI_KEY = "310e2fb6f9msh6d01a3ffb81e7bep108bfdjsn585121826d34"

FASHION_KEYWORDS = [
    # "men tshirt", "women dress", "running shoes", "sneakers",
    "men jeans", "women jeans", "casual shoes", "formal shoes",
    "wrist watch", "digital watch", "leather watch", "smartwatch",
    "women handbag", "men wallet", "sunglasses", "women top",
    "men shirt", "hoodie", "women skirt", "winter jacket",
    "sports shoes", "sandals", "heels", "women kurta",
    "men trousers", "leggings", "tracksuit", "men shorts"
]


class Command(BaseCommand):
    help = "Fetch fashion products from Amazon via RapidAPI"

    def add_arguments(self, parser):
        parser.add_argument('--start', type=int, default=0)

    def fetch_products(self, keyword, page=1, retries=3):
        url = "https://real-time-amazon-data.p.rapidapi.com/search"
        headers = {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
        }
        params = {
            "query": keyword,
            "page": str(page),
            "country": "IN",
            "category_id": "apparel"
        }

        for attempt in range(retries):
            try:
                response = requests.get(url, headers=headers, params=params)

                if response.status_code == 429:
                    wait = (attempt + 1) * 10
                    self.stdout.write(f"⏳ Rate limited. Waiting {wait}s...")
                    time.sleep(wait)
                    continue

                if response.status_code == 403:
                    self.stdout.write(f"🚫 403 Forbidden — '{keyword}' blocked on your plan")
                    return None

                response.raise_for_status()
                return response.json()

            except Exception as e:
                self.stdout.write(f"❌ Attempt {attempt+1}: {e}")
                time.sleep(10)

        return None

    def handle(self, *args, **kwargs):
        total_saved = 0
        target = 4000
        skip_keywords = set()
        start_index = kwargs['start']
        keywords = FASHION_KEYWORDS[start_index:]

        for keyword in keywords:
            if total_saved >= target:
                break
            if keyword in skip_keywords:
                continue

            for page in range(1, 6):
                if total_saved >= target:
                    break

                self.stdout.write(f"📦 Fetching: '{keyword}' page {page}...")
                data = self.fetch_products(keyword, page)

                if data is None:
                    skip_keywords.add(keyword)
                    break

                if "data" not in data:
                    break

                products = data["data"].get("products", [])
                if not products:
                    break

                for item in products:
                    try:
                        primary_image = item.get("product_photo") or item.get("thumbnail")
                        extra_images  = item.get("product_photos", [])
                        price_str = (
                            item.get("product_price", "")
                            .replace("₹", "").replace("$", "")
                            .replace(",", "").strip()
                        )

                        if not primary_image or not price_str:
                            continue

                        price = float(price_str.split("-")[0].strip())

                        collection, _ = Collection.objects.get_or_create(
                            slug=slugify(keyword),
                            defaults={"name": keyword.title()}
                        )

                        product, created = Product.objects.get_or_create(
                            asin=item.get("asin", ""),
                            defaults={
                                "title":       item.get("product_title", "")[:255],
                                "unit_price":  price,
                                "inventory":   100,
                                "collection":  collection,
                                "product_url": item.get("product_url", ""),
                                "avg_rating":  float(item.get("product_star_rating") or 0),
                                "num_ratings": int(item.get("product_num_ratings") or 0),
                            }
                        )

                        if created:
                            ProductImage.objects.create(
                                product=product,
                                image_url=primary_image,
                                is_primary=True
                            )
                            for extra_url in extra_images[:4]:
                                if extra_url and extra_url != primary_image:
                                    ProductImage.objects.create(
                                        product=product,
                                        image_url=extra_url,
                                        is_primary=False
                                    )
                            total_saved += 1

                            if total_saved % 100 == 0:
                                self.stdout.write(f"✅ Saved {total_saved} products...")

                    except Exception as e:
                        self.stdout.write(f"⚠️ Skipped: {e}")
                        continue

                time.sleep(2)  # ✅ 2 seconds between requests

        self.stdout.write(f"\n🎉 Done! Total saved: {total_saved}")