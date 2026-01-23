export function getSiteUrl(): string {
  // Prefer explicit configuration (works for all environments)
  const explicit =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL

  if (explicit) return explicit.startsWith('http') ? explicit : `https://${explicit}`

  // Vercel-provided URL (usually *.vercel.app; custom domain may not appear here)
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL

  if (vercel) return `https://${vercel}`

  // Production fallback for this project
  return 'https://maxentertain.com'
}

