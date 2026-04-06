import { createClient } from '@supabase/supabase-js'

// Falls back to embedded values when Vercel env vars are not set.
// Only used in /app/api/** route handlers (server-only bundles).
const url = process.env.SUPABASE_URL
  ?? 'https://ijjqxmzulmpzzsolzvmm.supabase.co'

const key = process.env.SUPABASE_SERVICE_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqanF4bXp1bG1wenpzb2x6dm1tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ2NDk4NSwiZXhwIjoyMDkxMDQwOTg1fQ.8SQOCDgLPgO9NKwQV8WUU0hCrFto36OOHrf8LD8XBhw'

export const supabase = createClient(url, key)
