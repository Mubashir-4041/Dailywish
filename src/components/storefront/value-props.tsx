import { Leaf, Truck, BadgeCheck, HeartHandshake } from 'lucide-react';

const items = [
  {
    icon: Leaf,
    title: '100% Natural',
    desc: 'Organic-quality ingredients, gentle on every skin type.',
  },
  {
    icon: BadgeCheck,
    title: 'Dermatologist Approved',
    desc: 'Formulated and tested for safe, visible results.',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    desc: 'Cash on Delivery & free shipping across Pakistan.',
  },
  {
    icon: HeartHandshake,
    title: 'Trusted by Thousands',
    desc: 'Loved nationwide - backed by real customer reviews.',
  },
];

export function ValueProps() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.title}
          className="flex flex-col items-center rounded-2xl border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <item.icon className="h-6 w-6" />
          </div>
          <h3 className="mt-3 font-semibold">{item.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}
