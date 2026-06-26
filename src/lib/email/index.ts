import 'server-only';
import { getEmailProvider } from './providers';
import type { EmailMessage } from './types';

/**
 * Send an email through the configured provider. Failures are swallowed &
 * logged so transactional flows (signup, checkout) never break on email errors.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  try {
    const provider = getEmailProvider();
    const res = await provider.send(message);
    return res.ok;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[email] send failed:', (err as Error).message);
    return false;
  }
}

export * from './templates';
export type { EmailMessage } from './types';
