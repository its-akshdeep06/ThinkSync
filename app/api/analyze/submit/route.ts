import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { supabase } from '@/lib/supabase-server'

// POST /api/analyze/submit — create an analysis job for a ready repo.
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const body = await req.json()
    const { repo_id } = body
    // Remote api.ts sends 'intent'; keep intent_text as fallback for compatibility
    const intent_text: string = body.intent ?? body.intent_text
    if (!repo_id || !intent_text) {
      return NextResponse.json({ error: 'Missing repo_id or intent' }, { status: 400 })
    }

    const { data: repo, error: repoErr } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repo_id)
      .eq('user_id', user.id)
      .single()

    if (repoErr || !repo) return NextResponse.json({ error: 'Repository not found' }, { status: 404 })

    if (repo.status !== 'ready') {
      return NextResponse.json(
        { error: 'Repository is not yet indexed. Please wait for indexing to complete.' },
        { status: 400 }
      )
    }

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .insert({
        repo_id,
        type: 'analyze-intent',
        status: 'running',
        intent_text,
        progress_pct: 0,
        outcome: null,
      })
      .select()
      .single()

    if (jobErr) {
      console.error('Create job error:', jobErr)
      return NextResponse.json({ error: 'Failed to create analysis job' }, { status: 500 })
    }

    // No background work needed — lazyUpdateJob advances progress on each poll.
    return NextResponse.json({ job_id: job.id })
  } catch (err) {
    console.error('Submit analysis error:', err)
    return NextResponse.json({ error: 'Failed to submit analysis' }, { status: 500 })
  }
}
