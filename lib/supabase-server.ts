import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client (service role — bypasses RLS).
// Only used in /app/api/** route handlers. Never imported by client components.
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)
