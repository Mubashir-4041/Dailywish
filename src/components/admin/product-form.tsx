'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Trash2, X, Loader2, Star, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ImageUploadButton } from '@/components/admin/image-upload-button';

export interface ProductImageInput {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface ProductVariantInput {
  name: string;
  value: string;
  sku: string;
  priceDelta: number;
  stock: number;
}

export interface ProductFormValues {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  price: number | string;
  comparePrice?: number | string;
  costPrice?: number | string;
  sku: string;
  stock: number | string;
  images: ProductImageInput[];
  variants: ProductVariantInput[];
  features: string[];
  ingredients: string;
  howToUse: string;
  size: string;
  tags: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
}

interface CategoryOption {
  _id: string;
  name: string;
}

/** Human-friendly labels for the zod field keys returned by the API. */
const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  slug: 'Slug',
  shortDescription: 'Short description',
  description: 'Full description',
  category: 'Category',
  price: 'Price',
  comparePrice: 'Compare-at price',
  costPrice: 'Cost price',
  sku: 'SKU',
  stock: 'Stock',
  images: 'Images',
  variants: 'Variants',
  features: 'Features',
  tags: 'Tags',
};

/**
 * A variant row is "untouched" when the user added it but never filled the two
 * fields the schema requires (`value` + `sku`). These get dropped before submit
 * so an empty "Add variant" click can't block the whole save. A *partially*
 * filled row (one of the two present) is kept on purpose, so the user gets a
 * pointed validation error rather than silently losing what they started typing.
 */
function isBlankVariant(v: ProductVariantInput): boolean {
  return !v.value.trim() && !v.sku.trim();
}

/** Turn the API's `{ field: [messages] }` payload into one readable line. */
function firstFieldError(
  details: Record<string, string[] | undefined>,
): string | null {
  for (const [field, messages] of Object.entries(details)) {
    const msg = messages?.[0];
    if (!msg) continue;
    // Nested keys look like `variants.0.sku` — label the root and keep the rest.
    const [root, ...rest] = field.split('.');
    const label = FIELD_LABELS[root!] ?? root!;
    const suffix = rest.length ? ` (${rest.join('.')})` : '';
    return `${label}${suffix}: ${msg}`;
  }
  return null;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  productId?: string;
  categories: CategoryOption[];
  imagePicker: string[];
  initial?: Partial<ProductFormValues>;
}

const emptyValues: ProductFormValues = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  category: '',
  price: '',
  comparePrice: '',
  costPrice: '',
  sku: '',
  stock: 0,
  images: [],
  variants: [],
  features: [],
  ingredients: '',
  howToUse: '',
  size: '',
  tags: [],
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: false,
  isActive: true,
};

export function ProductForm({
  mode,
  productId,
  categories,
  imagePicker,
  initial,
}: ProductFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>({
    ...emptyValues,
    ...initial,
    images: initial?.images ?? [],
    variants: initial?.variants ?? [],
    features: initial?.features ?? [],
    tags: initial?.tags ?? [],
  });
  const [featureInput, setFeatureInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ProductFormValues>(key: K, val: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function addImage(url: string) {
    const clean = url.trim();
    if (!clean) return;
    if (values.images.some((i) => i.url === clean)) {
      toast.info('Image already added');
      return;
    }
    setValues((v) => ({
      ...v,
      images: [
        ...v.images,
        { url: clean, alt: v.name, isPrimary: v.images.length === 0 },
      ],
    }));
  }

  function removeImage(url: string) {
    setValues((v) => {
      const next = v.images.filter((i) => i.url !== url);
      if (next.length && !next.some((i) => i.isPrimary) && next[0]) next[0].isPrimary = true;
      return { ...v, images: next };
    });
  }

  function setPrimary(url: string) {
    setValues((v) => ({
      ...v,
      images: v.images.map((i) => ({ ...i, isPrimary: i.url === url })),
    }));
  }

  function addVariant() {
    setValues((v) => ({
      ...v,
      variants: [...v.variants, { name: 'Size', value: '', sku: '', priceDelta: 0, stock: 0 }],
    }));
  }

  function updateVariant(index: number, patch: Partial<ProductVariantInput>) {
    setValues((v) => ({
      ...v,
      variants: v.variants.map((vr, i) => (i === index ? { ...vr, ...patch } : vr)),
    }));
  }

  function removeVariant(index: number) {
    setValues((v) => ({ ...v, variants: v.variants.filter((_, i) => i !== index) }));
  }

  function addToken(kind: 'features' | 'tags', raw: string) {
    const clean = raw.trim();
    if (!clean) return;
    setValues((v) => (v[kind].includes(clean) ? v : { ...v, [kind]: [...v[kind], clean] }));
  }

  function removeToken(kind: 'features' | 'tags', token: string) {
    setValues((v) => ({ ...v, [kind]: v[kind].filter((t) => t !== token) }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.category) {
      toast.error('Please choose a category');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...values,
        price: Number(values.price) || 0,
        stock: Number(values.stock) || 0,
        comparePrice: values.comparePrice ? Number(values.comparePrice) : undefined,
        costPrice: values.costPrice ? Number(values.costPrice) : undefined,
        variants: values.variants
          .filter((v) => !isBlankVariant(v))
          .map((v) => ({
            ...v,
            priceDelta: Number(v.priceDelta) || 0,
            stock: Number(v.stock) || 0,
          })),
      };
      const url = mode === 'create' ? '/api/admin/products' : `/api/admin/products/${productId}`;
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        details?: Record<string, string[] | undefined>;
      };
      if (!res.ok) {
        const fieldMsg = data.details && firstFieldError(data.details);
        toast.error(fieldMsg ?? data.error ?? 'Could not save product');
        return;
      }
      toast.success(mode === 'create' ? 'Product created' : 'Product updated');
      router.push('/admin/products');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => set('name', e.target.value)}
                maxLength={140}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="auto-generated from name"
                  value={values.slug}
                  onChange={(e) => set('slug', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={values.sku}
                  onChange={(e) => set('sku', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short description</Label>
              <Textarea
                id="shortDescription"
                rows={2}
                maxLength={280}
                value={values.shortDescription}
                onChange={(e) => set('shortDescription', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {values.shortDescription.length}/280 — long marketing copy belongs
                in <span className="font-medium">Full description</span> below.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Full description</Label>
              <Textarea
                id="description"
                rows={5}
                value={values.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              Upload from your device, paste an image URL, or pick from existing images.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUploadButton
              folder="products"
              multiple
              label="Upload from device"
              className="w-full sm:w-auto"
              onUploaded={(url) => addImage(url)}
            />
            <div className="flex gap-2">
              <Input
                placeholder="…or paste a URL: https://res.cloudinary.com/…"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImage(imageUrl);
                    setImageUrl('');
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addImage(imageUrl);
                  setImageUrl('');
                }}
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>

            {values.images.length ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {values.images.map((img) => (
                  <div
                    key={img.url}
                    className={cn(
                      'group relative aspect-square overflow-hidden rounded-lg border-2 bg-muted',
                      img.isPrimary ? 'border-primary' : 'border-transparent',
                    )}
                  >
                    <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="120px" />
                    <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        title="Set primary"
                        onClick={() => setPrimary(img.url)}
                        className="rounded bg-white/90 p-1 text-amber-500"
                      >
                        <Star className={cn('h-3.5 w-3.5', img.isPrimary && 'fill-amber-500')} />
                      </button>
                      <button
                        type="button"
                        title="Remove"
                        onClick={() => removeImage(img.url)}
                        className="rounded bg-white/90 p-1 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {img.isPrimary ? (
                      <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        Primary
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {imagePicker.length ? (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <ImagePlus className="h-3.5 w-3.5" /> Quick pick
                </p>
                <div className="flex flex-wrap gap-2">
                  {imagePicker.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => addImage(url)}
                      className="relative h-14 w-14 overflow-hidden rounded-md border bg-muted transition hover:ring-2 hover:ring-primary"
                    >
                      <Image src={url} alt="pick" fill className="object-cover" sizes="56px" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variants</CardTitle>
            <CardDescription>Optional size / option variants.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {values.variants.map((v, i) => (
              <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-lg border p-3">
                <div className="col-span-6 space-y-1 sm:col-span-2">
                  <Label className="text-xs">Name</Label>
                  <Input value={v.name} onChange={(e) => updateVariant(i, { name: e.target.value })} />
                </div>
                <div className="col-span-6 space-y-1 sm:col-span-2">
                  <Label className="text-xs">Value</Label>
                  <Input value={v.value} onChange={(e) => updateVariant(i, { value: e.target.value })} />
                </div>
                <div className="col-span-6 space-y-1 sm:col-span-3">
                  <Label className="text-xs">SKU</Label>
                  <Input value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} />
                </div>
                <div className="col-span-3 space-y-1 sm:col-span-2">
                  <Label className="text-xs">Δ Price</Label>
                  <Input
                    type="number"
                    value={v.priceDelta}
                    onChange={(e) => updateVariant(i, { priceDelta: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-2 space-y-1 sm:col-span-2">
                  <Label className="text-xs">Stock</Label>
                  <Input
                    type="number"
                    value={v.stock}
                    onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
              <Plus className="h-4 w-4" /> Add variant
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TokenField
              label="Features"
              tokens={values.features}
              input={featureInput}
              setInput={setFeatureInput}
              onAdd={(val) => addToken('features', val)}
              onRemove={(t) => removeToken('features', t)}
            />
            <TokenField
              label="Tags"
              tokens={values.tags}
              input={tagInput}
              setInput={setTagInput}
              onAdd={(val) => addToken('tags', val)}
              onRemove={(t) => removeToken('tags', t)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input id="size" value={values.size} onChange={(e) => set('size', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredients</Label>
              <Textarea
                id="ingredients"
                rows={2}
                value={values.ingredients}
                onChange={(e) => set('ingredients', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="howToUse">How to use</Label>
              <Textarea
                id="howToUse"
                rows={2}
                value={values.howToUse}
                onChange={(e) => set('howToUse', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pricing & stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (PKR)</Label>
              <Input
                id="price"
                type="number"
                value={values.price}
                onChange={(e) => set('price', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comparePrice">Compare-at price</Label>
              <Input
                id="comparePrice"
                type="number"
                value={values.comparePrice}
                onChange={(e) => set('comparePrice', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost price</Label>
              <Input
                id="costPrice"
                type="number"
                value={values.costPrice}
                onChange={(e) => set('costPrice', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={values.stock}
                onChange={(e) => set('stock', e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={values.category} onValueChange={(val) => set('category', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 pt-1">
              <FlagRow
                label="Active"
                checked={values.isActive}
                onChange={(c) => set('isActive', c)}
              />
              <FlagRow
                label="Featured"
                checked={values.isFeatured}
                onChange={(c) => set('isFeatured', c)}
              />
              <FlagRow
                label="Best seller"
                checked={values.isBestSeller}
                onChange={(c) => set('isBestSeller', c)}
              />
              <FlagRow
                label="New arrival"
                checked={values.isNewArrival}
                onChange={(c) => set('isNewArrival', c)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === 'create' ? 'Create product' : 'Save changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

function FlagRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm">
      <span className="font-medium">{label}</span>
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(c === true)} />
    </label>
  );
}

function TokenField({
  label,
  tokens,
  input,
  setInput,
  onAdd,
  onRemove,
}: {
  label: string;
  tokens: string[];
  input: string;
  setInput: (v: string) => void;
  onAdd: (v: string) => void;
  onRemove: (t: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd(input);
              setInput('');
            }
          }}
          placeholder={`Add ${label.toLowerCase()} and press Enter`}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onAdd(input);
            setInput('');
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {tokens.length ? (
        <div className="flex flex-wrap gap-1.5">
          {tokens.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
            >
              {t}
              <button type="button" onClick={() => onRemove(t)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
