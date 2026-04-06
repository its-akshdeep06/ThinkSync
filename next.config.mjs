/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Server-side env vars baked in at build time.
  // These are only used in /app/api/** route handlers (server-only),
  // so they will NOT be included in the client-side JS bundle.
  // Note: keep this repo PRIVATE since credentials are listed here.
  env: {
    SUPABASE_URL: 'https://ijjqxmzulmpzzsolzvmm.supabase.co',
    SUPABASE_SERVICE_KEY:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqanF4bXp1bG1wenpzb2x6dm1tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ2NDk4NSwiZXhwIjoyMDkxMDQwOTg1fQ.8SQOCDgLPgO9NKwQV8WUU0hCrFto36OOHrf8LD8XBhw',
    GITHUB_CLIENT_ID: 'Ov23liwoGI6vDrWr9VBz',
    GITHUB_CLIENT_SECRET: '115e33eb5bfa1967622ace4ed14e5efbc81e90d5',
    JWT_SECRET: 'thinksync-jwt-secret-k9x2m7p4q8r3n6w1',
    FRONTEND_URL: 'https://think-sync-seven.vercel.app',
  },
}

export default nextConfig
