import type { Metadata } from 'next';
import { CategoryShowcase } from '@/components/storefront/category-showcase';
import { SectionHeading } from '@/components/storefront/section-heading';
import { getCategories } from '@/server/catalog';

export const metadata: Metadata = {
  title: 'Shop by Category',
  description:
    'Browse DailyWish skincare categories - face wash, serums, creams, whitening, acne care, skin polish and bundles.',
  alternates: { canonical: '/categories' },
};

export const revalidate = 600;

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <div className="container py-10">
      <SectionHeading
        eyebrow="Browse"
        title="All Categories"
        description="Find exactly what your skin needs."
        align="center"
      />
      <CategoryShowcase categories={categories} />
    </div>
  );
}
