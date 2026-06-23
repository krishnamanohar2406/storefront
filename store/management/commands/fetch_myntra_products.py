import csv
import os
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from store.models import Product, Collection, ProductImage  # ✅ adjust 'store' to your app name


class Command(BaseCommand):
    help = "Import 25,000 fashion products from CSV into database"

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='data.csv',
            help='Path to your CSV file (default: data.csv)'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=25000,
            help='Max number of products to import (default: 25000)'
        )
        parser.add_argument(
            '--skip',
            type=int,
            default=0,
            help='Skip first N rows (for resuming)'
        )

    def handle(self, *args, **kwargs):
        csv_file  = kwargs['file']
        limit     = kwargs['limit']
        skip      = kwargs['skip']

        if not os.path.exists(csv_file):
            self.stdout.write(self.style.ERROR(f"❌ File not found: {csv_file}"))
            self.stdout.write("Usage: python manage.py import_fashion_products --file path/to/data.csv")
            return

        total_saved   = 0
        total_skipped = 0
        total_dupes   = 0

        self.stdout.write(f"📂 Opening: {csv_file}")
        self.stdout.write(f"🎯 Target: {limit} products\n")

        with open(csv_file, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)

            for i, row in enumerate(reader):

                # --- Resume support ---
                if i < skip:
                    continue

                # --- Stop at limit ---
                if total_saved >= limit:
                    break

                try:
                    # ── 1. Product Name ──────────────────────────────────────
                    title = row.get('product_name', '').strip()
                    if not title:
                        total_skipped += 1
                        continue

                    # ── 2. Price ─────────────────────────────────────────────
                    # use discounted_price as unit_price, marked_price as original
                    def parse_price(val):
                        try:
                            return float(str(val).replace('₹', '').replace(',', '').strip())
                        except:
                            return None

                    unit_price     = parse_price(row.get('discounted_price', ''))
                    original_price = parse_price(row.get('marked_price', ''))

                    # skip if no valid price
                    if not unit_price or unit_price <= 0:
                        total_skipped += 1
                        continue

                    # ── 3. Collection (from product_tag) ─────────────────────
                    product_tag = row.get('product_tag', '').strip().lower()
                    if not product_tag:
                        product_tag = 'general'

                    # clean tag: "kurta-sets/fast..." → "kurta-sets"
                    clean_tag = product_tag.split('/')[0].strip()
                    collection_name = clean_tag.replace('-', ' ').title()
                    collection_slug = slugify(clean_tag)

                    collection, _ = Collection.objects.get_or_create(
                        slug=collection_slug,
                        defaults={'name': collection_name}
                    )

                    # ── 4. Sizes ──────────────────────────────────────────────
                    sizes_raw = row.get('sizes', '').strip()
                    # CSV has: "S,M,L,XL,XXL" or "UK6,UK7,UK8"
                    if sizes_raw:
                        sizes_list = [s.strip() for s in sizes_raw.split(',') if s.strip()]
                    else:
                        sizes_list = []

                    # ── 5. Rating ─────────────────────────────────────────────
                    try:
                        avg_rating = float(row.get('rating', 0) or 0)
                    except:
                        avg_rating = 0.0

                    try:
                        num_ratings = int(float(row.get('rating_count', 0) or 0))
                    except:
                        num_ratings = 0

                    # ── 6. Brand ──────────────────────────────────────────────
                    brand = row.get('brand_name', '').strip()[:100]

                    # ── 7. URLs ───────────────────────────────────────────────
                    product_url = row.get('product_link', '').strip()
                    img_url     = row.get('img_link', '').strip()

                    # ── 8. Discount ───────────────────────────────────────────
                    try:
                        discount_pct = float(row.get('discount_percent', 0) or 0)
                    except:
                        discount_pct = 0.0

                    # ── 9. Create Product ─────────────────────────────────────
                    # use product_url as unique identifier (no asin in this dataset)
                    # fallback: use title+brand as unique key
                    base_slug  = slugify(f"{title}-{brand}")[:45]  # leave room for counter
                    unique_key = f"{base_slug}-{i}" 

                    product, created = Product.objects.get_or_create(
                        slug=unique_key,
                        defaults={
                            'title':          title[:255],
                            'unit_price':     unit_price,
                            'original_price': original_price,
                            'inventory':      100,
                            'brand':          brand,
                            'sizes':          sizes_list,
                            'collection':     collection,
                            'product_url':    product_url[:1000] if product_url else '',
                            'avg_rating':     avg_rating,
                            'num_ratings':    num_ratings,
                        }
                    )

                    if not created:
                        total_dupes += 1
                        continue

                    # ── 10. Save Image ────────────────────────────────────────
                    if img_url:
                        ProductImage.objects.create(
                            product=product,
                            image_url=img_url[:1000],
                            is_primary=True
                        )

                    total_saved += 1

                    # ── Progress every 500 ────────────────────────────────────
                    if total_saved % 500 == 0:
                        self.stdout.write(
                            f"✅ Saved: {total_saved} | "
                            f"Skipped: {total_skipped} | "
                            f"Dupes: {total_dupes} | "
                            f"Row: {i+1}"
                        )

                except Exception as e:
                    self.stdout.write(f"⚠️  Row {i+1} error: {e}")
                    total_skipped += 1
                    continue

        # ── Final Summary ─────────────────────────────────────────────────────
        self.stdout.write("\n" + "="*50)
        self.stdout.write(self.style.SUCCESS(f"🎉 Import Complete!"))
        self.stdout.write(f"   ✅ Products saved : {total_saved}")
        self.stdout.write(f"   ⚠️  Skipped        : {total_skipped}")
        self.stdout.write(f"   🔁 Duplicates     : {total_dupes}")
        self.stdout.write("="*50)