import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { supabase } from '@/lib/supabase-server'

// POST /api/repos/:id/reindex — reset a repo back to pending so simulation reruns.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params

  const { data: repo } = await supabase
    .from('repositories')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!repo) return NextResponse.json({ error: 'Repository not found' }, { status: 404 })

  // Reset to pending — lazy simulation will advance it again on next poll
  await supabase
    .from('repositories')
    .update({ status: 'pending', indexed_at: null, file_count: 0, node_count: 0 })
    .eq('id', id)

  // Create a tracking job
  const { data: job } = await supabase
    .from('jobs')
    .insert({ repo_id: id, type: 'ingest-repository', status: 'running', progress_pct: 0 })
    .select()
    .single()

  return NextResponse.json({ success: true, job_id: job?.id })
}
