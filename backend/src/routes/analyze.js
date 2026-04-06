import { Router } from 'express';
import supabase from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { askML } from '../lib/ml.js';

const router = Router();

// POST /api/analyze - submit intent for analysis against an indexed repo
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { repo_id, intent } = req.body;
    if (!repo_id || !intent) {
      return res.status(400).json({ error: 'Missing repo_id or intent' });
    }

    // Verify repo ownership
    const { data: repo, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repo_id)
      .eq('user_id', req.user.id)
      .single();

    if (repoError || !repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    if (repo.status !== 'ready') {
      return res.status(400).json({ error: 'Repository is not yet indexed. Please wait for indexing to complete.' });
    }

    // Get ML repo_id from the completed ingest job
    const { data: ingestJob } = await supabase
      .from('jobs')
      .select('outcome')
      .eq('repo_id', repo_id)
      .eq('type', 'ingest-repository')
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const mlRepoId = ingestJob?.outcome?.ml_repo_id;
    if (!mlRepoId) {
      return res.status(400).json({ error: 'Repository indexing data not found. Try reindexing the repository.' });
    }

    // Create analyze-intent job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        repo_id,
        type: 'analyze-intent',
        status: 'running',
        progress_pct: 0,
        intent_text: intent,
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Run ML intent analysis in background
    runIntentAnalysis(job.id, mlRepoId, intent).catch(err => {
      console.error(`[ML] Intent analysis error for job ${job.id}:`, err.message);
    });

    res.json({ job_id: job.id });
  } catch (err) {
    console.error('Analyze submit error:', err);
    res.status(500).json({ error: 'Failed to start analysis' });
  }
});

// GET /api/analyze/:jobId - get analysis result (used by plan and PR pages)
router.get('/:jobId', authMiddleware, async (req, res) => {
  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', req.params.jobId)
      .single();

    if (error || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify ownership via repo
    const { data: repo } = await supabase
      .from('repositories')
      .select('user_id, name, full_name, github_repo_url')
      .eq('id', job.repo_id)
      .single();

    if (!repo || repo.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const outcome = job.outcome || {};
    const result = {
      changes: outcome.changes || [],
      structured_intent: outcome.structured_intent || {
        analysis: outcome.answer || '',
        risk_level: 'medium',
        impact_report: {
          direct_changes: 0,
          first_degree_callers: 0,
          transitive_deps: 0,
        },
      },
      pr_url: job.pr_url || null,
    };

    res.json({
      job,
      result,
      repo: { full_name: repo.full_name, github_repo_url: repo.github_repo_url },
    });
  } catch (err) {
    console.error('Get analyze result error:', err);
    res.status(500).json({ error: 'Failed to get analysis result' });
  }
});

async function runIntentAnalysis(jobId, mlRepoId, intent) {
  try {
    await supabase.from('jobs').update({ progress_pct: 20 }).eq('id', jobId);

    const question = `Describe the code changes needed to accomplish the following intent, including which files to modify and why: ${intent}`;
    const answer = await askML(mlRepoId, question);

    await supabase.from('jobs').update({ progress_pct: 80 }).eq('id', jobId);

    await supabase
      .from('jobs')
      .update({
        status: 'complete',
        progress_pct: 100,
        outcome: {
          ml_repo_id: mlRepoId,
          answer,
          structured_intent: {
            analysis: answer,
            risk_level: 'medium',
            impact_report: {
              direct_changes: 0,
              first_degree_callers: 0,
              transitive_deps: 0,
            },
          },
          changes: [],
        },
      })
      .eq('id', jobId);

    console.log(`[ML] Intent analysis complete for job ${jobId}`);
  } catch (err) {
    await supabase
      .from('jobs')
      .update({ status: 'failed', error_msg: err.message })
      .eq('id', jobId);
  }
}

export default router;
