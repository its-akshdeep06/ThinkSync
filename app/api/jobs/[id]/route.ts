import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { supabase } from '@/lib/supabase-server'
import { lazyUpdateJob } from '@/lib/repo-utils'

// GET /api/jobs/:id — get a single job.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const { data: job, error } = await supabase.from('jobs').select('*').eq('id', id).single()
  if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // Verify ownership via repo
  const { data: repo } = await supabase
    .from('repositories')
    .select('user_id')
    .eq('id', job.repo_id)
    .single()

  if (!repo || repo.user_id !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const updated = await lazyUpdateJob(job)
  return NextResponse.json({ job: updated })
}
