import 'server-only';
import { eq } from 'drizzle-orm';
import { siteConfig } from '@/config/site';
import { getDb } from '@/lib/db';
import { settings } from '@/db/schema';

export interface WalletDetails {
  number: string;
  accountName: string;
}

export interface SiteSettings {
  /** Custom announcement-bar text. Empty string → use the default strip. */
  announcement: string;
  freeShippingThreshold: number;
  social: {
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
  };
  /** Wallet numbers customers pay to for the manual checkout methods. */
  payments: {
    easypaisa: WalletDetails;
    jazzcash: WalletDetails;
  };
}

function defaults(): SiteSettings {
  return {
    announcement: '',
    freeShippingThreshold: siteConfig.shipping.freeThreshold,
    social: { ...siteConfig.social },
    payments: {
      easypaisa: { ...siteConfig.payments.easypaisa },
      jazzcash: { ...siteConfig.payments.jazzcash },
    },
  };
}

const str = (v: unknown, fallback: string) =>
  typeof v === 'string' && v.trim() ? v : fallback;

/**
 * Read editable store settings from the DB (group `general`), falling back to
 * the static {@link siteConfig} for any key that hasn't been overridden - or
 * when no database is configured. Reads run per-request, so admin changes show
 * up on the storefront after the next navigation/refresh.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const base = defaults();
  if (!process.env.DATABASE_URL) return base;

  try {
    const db = getDb();
    const docs = await db
      .select()
      .from(settings)
      .where(eq(settings.group, 'general'));
    const map: Record<string, unknown> = {};
    for (const d of docs) map[d.key] = d.value;

    return {
      announcement: str(map.announcement, base.announcement),
      freeShippingThreshold:
        typeof map.freeShippingThreshold === 'number'
          ? map.freeShippingThreshold
          : base.freeShippingThreshold,
      social: {
        facebook: str(map.facebook, base.social.facebook),
        instagram: str(map.instagram, base.social.instagram),
        tiktok: str(map.tiktok, base.social.tiktok),
        youtube: str(map.youtube, base.social.youtube),
      },
      payments: {
        easypaisa: {
          number: str(map.easypaisaNumber, base.payments.easypaisa.number),
          accountName: str(map.easypaisaName, base.payments.easypaisa.accountName),
        },
        jazzcash: {
          number: str(map.jazzcashNumber, base.payments.jazzcash.number),
          accountName: str(map.jazzcashName, base.payments.jazzcash.accountName),
        },
      },
    };
  } catch {
    return base;
  }
}
