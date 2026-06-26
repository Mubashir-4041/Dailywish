import { siteConfig } from '@/config/site';
import { formatPrice } from '@/lib/utils';
import type { OrderRow } from '@/db/schema';

/** The subset of order fields the transactional email templates render. */
type OrderEmailData = Pick<
  OrderRow,
  | 'orderNumber'
  | 'items'
  | 'shippingAddress'
  | 'subtotal'
  | 'shipping'
  | 'discount'
  | 'total'
  | 'paymentMethod'
  | 'status'
>;

const BRAND = siteConfig.url;

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="text-align:center;padding:16px 0">
      <span style="font-size:26px;font-weight:bold;color:#1b61d7">Daily<span style="color:#f59e0b">Wish</span></span>
    </div>
    <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
      ${body}
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px">
      ${siteConfig.legalName} · ${siteConfig.phone} · ${siteConfig.email}<br/>
      © ${siteConfig.founded} DailyWish. All rights reserved.
    </p>
  </div></body></html>`;
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#1b61d7;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold">${label}</a>`;

export function welcomeEmail(name: string) {
  return {
    subject: 'Welcome to DailyWish ✨',
    html: layout(
      `Welcome, ${name}!`,
      `<p>Thank you for joining DailyWish - your destination for premium skincare & cosmetics.</p>
       <p>Start your glow journey today.</p>
       <p style="margin-top:24px">${btn(`${BRAND}/shop`, 'Shop Now')}</p>`,
    ),
  };
}

export function verifyEmail(name: string, token: string) {
  const url = `${BRAND}/verify-email?token=${token}`;
  return {
    subject: 'Verify your DailyWish email',
    html: layout(
      `Hi ${name}, verify your email`,
      `<p>Please confirm your email address to activate your account.</p>
       <p style="margin-top:24px">${btn(url, 'Verify Email')}</p>
       <p style="color:#6b7280;font-size:13px;margin-top:16px">This link expires in 24 hours.</p>`,
    ),
  };
}

export function resetPasswordEmail(name: string, token: string) {
  const url = `${BRAND}/reset-password?token=${token}`;
  return {
    subject: 'Reset your DailyWish password',
    html: layout(
      `Hi ${name}, reset your password`,
      `<p>We received a request to reset your password. Click below to choose a new one.</p>
       <p style="margin-top:24px">${btn(url, 'Reset Password')}</p>
       <p style="color:#6b7280;font-size:13px;margin-top:16px">If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</p>`,
    ),
  };
}

export function orderConfirmationEmail(order: OrderEmailData) {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0">${i.name} × ${i.quantity}</td><td style="padding:8px 0;text-align:right">${formatPrice(
          i.price * i.quantity,
        )}</td></tr>`,
    )
    .join('');
  return {
    subject: `Order Confirmed - ${order.orderNumber}`,
    html: layout(
      'Thank you for your order! 🎉',
      `<p>Hi ${order.shippingAddress.fullName}, we've received your order <strong>${order.orderNumber}</strong>.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0">
        ${rows}
        <tr><td style="padding:8px 0;border-top:1px solid #e5e7eb">Subtotal</td><td style="padding:8px 0;border-top:1px solid #e5e7eb;text-align:right">${formatPrice(order.subtotal)}</td></tr>
        <tr><td style="padding:4px 0">Shipping</td><td style="padding:4px 0;text-align:right">${order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</td></tr>
        ${order.discount ? `<tr><td style="padding:4px 0">Discount</td><td style="padding:4px 0;text-align:right">-${formatPrice(order.discount)}</td></tr>` : ''}
        <tr><td style="padding:8px 0;font-weight:bold;font-size:16px">Total</td><td style="padding:8px 0;text-align:right;font-weight:bold;font-size:16px">${formatPrice(order.total)}</td></tr>
       </table>
       <p>Payment method: <strong>${order.paymentMethod.toUpperCase()}</strong></p>
       <p style="margin-top:24px">${btn(`${BRAND}/account/orders`, 'Track Your Order')}</p>`,
    ),
  };
}

export function orderStatusEmail(order: OrderEmailData) {
  return {
    subject: `Order ${order.orderNumber} is now ${order.status}`,
    html: layout(
      `Your order is ${order.status}`,
      `<p>Hi ${order.shippingAddress.fullName}, your order <strong>${order.orderNumber}</strong> status has been updated to <strong>${order.status}</strong>.</p>
       <p style="margin-top:24px">${btn(`${BRAND}/account/orders`, 'View Order')}</p>`,
    ),
  };
}

export function contactNotificationEmail(input: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  return {
    subject: `New contact message: ${input.subject}`,
    html: layout(
      'New Contact Form Submission',
      `<p><strong>Name:</strong> ${input.name}</p>
       <p><strong>Email:</strong> ${input.email}</p>
       ${input.phone ? `<p><strong>Phone:</strong> ${input.phone}</p>` : ''}
       <p><strong>Subject:</strong> ${input.subject}</p>
       <p><strong>Message:</strong><br/>${input.message.replace(/\n/g, '<br/>')}</p>`,
    ),
  };
}
