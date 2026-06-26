import { z } from 'zod';

/**
 * Centralised, type-safe environment configuration.
 *
 * Required variables are enforced in production. In development we allow
 * sensible fallbacks so the app boots for local exploration, while still
 * logging a clear warning about what should be configured before deploy.
 */
const isProd = process.env.NODE_ENV === 'production';

const stringDefault = (prodRequired: boolean, devFallback: string) =>
  isProd
    ? z.string().min(1)
    : z.string().min(1).optional().default(devFallback);

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Database - optional everywhere: the storefront gracefully falls back to
  // the static catalog when a DB is unreachable. Auth/checkout/admin still
  // require it and return a clear 503 when absent.
  DATABASE_URL: z.string().optional(),

  // Auth secrets
  JWT_SECRET: stringDefault(true, 'dev-insecure-jwt-secret-change-me-0123456789'),
  JWT_REFRESH_SECRET: stringDefault(
    true,
    'dev-insecure-refresh-secret-change-me-0123456789',
  ),
  NEXTAUTH_SECRET: stringDefault(false, 'dev-insecure-nextauth-secret'),

  // URLs
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .optional()
    .default('http://localhost:3000'),

  // Seed admin
  ADMIN_EMAIL: z.string().email().optional().default('admin@dailywish.pk'),
  ADMIN_PASSWORD: z.string().min(8).optional().default('Admin@12345'),

  // Cloudinary (image hosting) - optional, local images used as fallback
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Email
  EMAIL_PROVIDER: z.enum(['resend', 'smtp', 'console']).default('console'),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z
    .string()
    .optional()
    .default('DailyWish <no-reply@dailywish.pk>'),

  // Payments — secret/restricted keys are server-only; only the publishable
  // key (NEXT_PUBLIC_) is ever sent to the browser.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_RESTRICTED_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    // Fail fast & safe - never boot a misconfigured production server.
    throw new Error(
      `❌ Invalid environment configuration:\n${issues}\n\n` +
        `See .env.example for the full list of variables.`,
    );
  }

  if (parsed.data.NODE_ENV !== 'production' && !parsed.data.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠️  DATABASE_URL is not set - running with the in-memory static catalog. ' +
        'Set DATABASE_URL in .env.local and run `npm run seed` for full functionality.',
    );
  }

  return parsed.data;
}

export const env = loadEnv();
