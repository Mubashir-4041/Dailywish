import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ChevronLeft } from 'lucide-react';
import { PageHeader, DbNotice } from '@/components/admin/admin-ui';
import { ProductForm, type ProductFormValues } from '@/components/admin/product-form';
import { getCategoryOptions, getImagePicker } from '@/app/admin/_lib/options';
import { getDb } from '@/lib/db';
import { products } from '@/db/schema';

export const dynamic = 'force-dynamic';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadProduct(id: string): Promise<Partial<ProductFormValues> | null> {
  if (!process.env.DATABASE_URL) return null;
  if (!UUID_RE.test(id)) return null;
  try {
    const db = getDb();
    const [doc] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!doc) return null;
    return {
      name: doc.name,
      slug: doc.slug,
      shortDescription: doc.shortDescription ?? '',
      description: doc.description ?? '',
      category: String(doc.categoryId),
      price: doc.price,
      comparePrice: doc.comparePrice ?? '',
      costPrice: doc.costPrice ?? '',
      sku: doc.sku,
      stock: doc.stock ?? 0,
      images: (doc.images ?? []).map((i) => ({
        url: i.url,
        alt: i.alt ?? '',
        isPrimary: !!i.isPrimary,
      })),
      variants: (doc.variants ?? []).map((v) => ({
        name: v.name,
        value: v.value,
        sku: v.sku,
        priceDelta: v.priceDelta ?? 0,
        stock: v.stock ?? 0,
      })),
      features: doc.features ?? [],
      ingredients: doc.ingredients ?? '',
      howToUse: doc.howToUse ?? '',
      size: doc.size ?? '',
      tags: doc.tags ?? [],
      isFeatured: !!doc.isFeatured,
      isBestSeller: !!doc.isBestSeller,
      isNewArrival: !!doc.isNewArrival,
      isActive: doc.isActive !== false,
    };
  } catch {
    return null;
  }
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [categories, initial] = await Promise.all([getCategoryOptions(), loadProduct(id)]);
  const imagePicker = getImagePicker();
  const noDb = !process.env.DATABASE_URL;

  if (!noDb && !initial) notFound();

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to products
      </Link>
      <PageHeader title="Edit product" description="Update product details and inventory." />
      {noDb ? <DbNotice /> : null}
      <ProductForm
        mode="edit"
        productId={id}
        categories={categories}
        imagePicker={imagePicker}
        initial={initial ?? undefined}
      />
    </div>
  );
}
