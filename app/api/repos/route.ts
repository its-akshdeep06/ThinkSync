import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { supabase } from '@/lib/supabase-server'
import { lazyUpdateRepo } from '@/lib/repo-utils'

// GET /api/repos — list all repos for the authenticated user.
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: repos, error } = await supabase
    .from('repositories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('List repos error:', error)
    return NextResponse.json({ error: 'Failed to list repositories' }, { status: 500 })
  }

  // Lazy-advance simulation: repos that have been "indexing" long enough become ready.
  const updatedRepos = await Promise.all((repos ?? []).map(lazyUpdateRepo))

  return NextResponse.json({ repos: updatedRepos })
}
