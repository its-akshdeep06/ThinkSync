import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { supabase } from '@/lib/supabase-server'
import { lazyUpdateJob } from '@/lib/repo-utils'

// GET /api/jobs — list jobs, optionally filtered by repo_id and/or type.
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const repoId = searchParams.get('repo_id')
  const type = searchParams.get('type')
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)

  // Verify repo ownership if repo_id provided
  if (repoId) {
    const { data: repo } = await supabase
      .from('repositories')
      .select('id')
      .eq('id', repoId)
      .eq('user_id', user.id)
      .single()
    if (!repo) return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
  }

  let query = supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (repoId) query = query.eq('repo_id', repoId)
  if (type) query = query.eq('type', type)

  const { data: jobs, error } = await query

  if (error) {
    console.error('List jobs error:', error)
    return NextResponse.json({ error: 'Failed to list jobs' }, { status: 500 })
  }

  const updatedJobs = await Promise.all((jobs ?? []).map(lazyUpdateJob))
  return NextResponse.json({ jobs: updatedJobs })
}
