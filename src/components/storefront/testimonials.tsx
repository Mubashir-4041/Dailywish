'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { Rating } from '@/components/ui/rating';
import type { Testimonial } from '@/types';

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {testimonials.map((t, i) => (
        <motion.figure
          key={t._id}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          className="relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm"
        >
          <Quote className="h-8 w-8 text-primary/20" />
          <Rating value={t.rating} className="mt-2" />
          <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground/90">
            “{t.quote}”
          </blockquote>
          <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
            {t.avatar ? (
              <div className="relative h-11 w-11 overflow-hidden rounded-full bg-muted">
                <Image src={t.avatar} alt={t.name} fill sizes="44px" className="object-cover" />
              </div>
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                {t.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">{t.name}</p>
              {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
            </div>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  );
}
