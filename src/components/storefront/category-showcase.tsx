import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/types';

export function CategoryShowcase({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/shop?category=${c.slug}`}
          className="group relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted"
        >
          {c.image && (
            <Image
              src={c.image}
              alt={c.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="font-semibold text-white">{c.name}</h3>
            <span className="text-xs text-white/80 group-hover:underline">
              Shop now →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
