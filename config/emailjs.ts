export type EmailJsConfig = {
  serviceId: string
  templateId: string
  publicKey: string
}

/**
 * Single source of truth for EmailJS configuration.
 *
 * - In production, you can (optionally) override these via hosting environment variables:
 *   NEXT_PUBLIC_EMAILJS_SERVICE_ID, NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
 * - Defaults are used when env vars are not present.
 */
export const emailJsConfig: EmailJsConfig = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_r9h3w9r',
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_bp3ysul',
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'Qd4vqOv_XHXYx5YDS',
}

