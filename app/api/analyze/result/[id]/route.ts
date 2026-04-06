import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { supabase } from '@/lib/supabase-server'
import { lazyUpdateJob } from '@/lib/repo-utils'

// GET /api/analyze/result/:id — get the result of an analysis job.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (jobErr || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // Verify ownership via repo
  const { data: repo, error: repoErr } = await supabase
    .from('repositories')
    .select('*')
    .eq('id', job.repo_id)
    .single()

  if (repoErr || !repo || repo.user_id !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Advance simulation if still running
  const updatedJob = await lazyUpdateJob(job)

  return NextResponse.json({
    job: {
      id: updatedJob.id,
      type: updatedJob.type,
      status: updatedJob.status,
      intent_text: updatedJob.intent_text,
      pr_url: updatedJob.pr_url,
      pr_number: updatedJob.pr_number,
      progress_pct: updatedJob.progress_pct,
      created_at: updatedJob.created_at,
      error_msg: updatedJob.error_msg,
    },
    result: updatedJob.outcome ?? null,
    repo: {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      github_repo_url: repo.github_repo_url,
    },
  })
}
