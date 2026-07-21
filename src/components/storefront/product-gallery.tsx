'use client';
import * as React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ImagePlaceholder } from '@/components/storefront/image-placeholder';
import type { ProductImage } from '@/types';

export function ProductGallery({
  images,
  name,
}: {
  images: ProductImage[];
  name: string;
}) {
  const [active, setActive] = React.useState(0);
  const list = images;
  const current = list[active];

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        key={active}
        initial={{ opacity: 0.4, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative aspect-square overflow-hidden rounded-2xl border bg-muted"
      >
        {current ? (
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <ImagePlaceholder label={name} />
        )}
      </motion.div>

      {list.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {list.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-lg border-2 bg-muted transition-all',
                i === active ? 'border-primary' : 'border-transparent hover:border-border',
              )}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.alt || `${name} ${i + 1}`}
                fill
                sizes="100px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
