export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  siteUrl: import.meta.env.VITE_SITE_URL ?? 'https://poupi-site.pages.dev',
} as const
