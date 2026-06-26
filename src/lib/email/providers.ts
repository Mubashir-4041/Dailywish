import 'server-only';
import type { EmailProvider, EmailMessage } from './types';

const FROM = process.env.EMAIL_FROM ?? 'DailyWish <no-reply@dailywish.pk>';

/** Logs emails to the server console - the default in dev / when unconfigured. */
class ConsoleProvider implements EmailProvider {
  readonly name = 'console';
  async send(message: EmailMessage) {
    // eslint-disable-next-line no-console
    console.log(
      `\n📧 [email:console] To: ${message.to}\n   Subject: ${message.subject}\n   (configure EMAIL_PROVIDER to actually send)\n`,
    );
    return { ok: true };
  }
}

/** Resend (https://resend.com) transactional email provider. */
class ResendProvider implements EmailProvider {
  readonly name = 'resend';
  async send(message: EmailMessage) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
    });
    if (error) throw new Error(error.message);
    return { id: data?.id, ok: true };
  }
}

/** SMTP / Nodemailer provider (works with any SMTP host). */
class SmtpProvider implements EmailProvider {
  readonly name = 'smtp';
  async send(message: EmailMessage) {
    const nodemailer = await import('nodemailer');
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    const info = await transport.sendMail({
      from: FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
    });
    return { id: info.messageId, ok: true };
  }
}

/** Factory - selects the provider based on EMAIL_PROVIDER env. */
export function getEmailProvider(): EmailProvider {
  switch (process.env.EMAIL_PROVIDER) {
    case 'resend':
      return new ResendProvider();
    case 'smtp':
      return new SmtpProvider();
    default:
      return new ConsoleProvider();
  }
}
