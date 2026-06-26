import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader, DbNotice } from '@/components/admin/admin-ui';
import { ProductForm } from '@/components/admin/product-form';
import { getCategoryOptions, getImagePicker } from '@/app/admin/_lib/options';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const categories = await getCategoryOptions();
  const imagePicker = getImagePicker();
  const noDb = !process.env.DATABASE_URL;

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to products
      </Link>
      <PageHeader title="New product" description="Add a product to your catalog." />
      {noDb ? <DbNotice /> : null}
      <ProductForm mode="create" categories={categories} imagePicker={imagePicker} />
    </div>
  );
}
