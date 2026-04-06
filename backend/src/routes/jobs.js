import { Router } from 'express';
import supabase from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/jobs/:id - get job status (used for polling)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !job) return res.status(404).json({ error: 'Job not found' });

    // Verify ownership
    const { data: repo } = await supabase
      .from('repositories')
      .select('user_id, name, full_name')
      .eq('id', job.repo_id)
      .single();

    if (!repo || repo.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ job: { ...job, repo_name: repo.full_name } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

// GET /api/jobs - list jobs for a repo or all user repos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { repo_id, type, limit = 20 } = req.query;

    // If repo_id specified, verify ownership
    if (repo_id) {
      const { data: repo } = await supabase
        .from('repositories')
        .select('user_id')
        .eq('id', repo_id)
        .single();

      if (!repo || repo.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get user's repo IDs for filtering
    const { data: userRepos } = await supabase
      .from('repositories')
      .select('id')
      .eq('user_id', req.user.id);

    const repoIds = (userRepos || []).map(r => r.id);
    if (repoIds.length === 0) {
      return res.json({ jobs: [] });
    }

    let query = supabase
      .from('jobs')
      .select('*')
      .in('repo_id', repoIds)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (repo_id) query = query.eq('repo_id', repo_id);
    if (type) query = query.eq('type', type);

    const { data: jobs, error } = await query;
    if (error) throw error;

    res.json({ jobs: jobs || [] });
  } catch (err) {
    console.error('List jobs error:', err);
    res.status(500).json({ error: 'Failed to list jobs' });
  }
});

export default router;
