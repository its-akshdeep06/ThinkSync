import { Router } from 'express';
import supabase from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { getRepoDetails, listUserRepos } from '../lib/github.js';

const router = Router();

// GET /api/repos - list user's connected repos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: repos, error } = await supabase
      .from('repositories')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ repos: repos || [] });
  } catch (err) {
    console.error('List repos error:', err);
    res.status(500).json({ error: 'Failed to list repositories' });
  }
});

// GET /api/repos/github - list user's GitHub repos (for connect picker)
router.get('/github', authMiddleware, async (req, res) => {
  try {
    const ghRepos = await listUserRepos(req.user.access_token);

    // Get already-connected repo full_names
    const { data: connected } = await supabase
      .from('repositories')
      .select('full_name')
      .eq('user_id', req.user.id);

    const connectedNames = new Set((connected || []).map(r => r.full_name));

    // Mark which repos are already connected
    const repos = ghRepos.map(r => ({
      ...r,
      connected: connectedNames.has(r.full_name),
    }));

    res.json({ repos });
  } catch (err) {
    console.error('List GitHub repos error:', err);
    res.status(500).json({ error: 'Failed to list GitHub repositories' });
  }
});

// POST /api/repos/connect - connect a new repository
router.post('/connect', authMiddleware, async (req, res) => {
  try {
    const { github_repo_url } = req.body;
    if (!github_repo_url) return res.status(400).json({ error: 'Missing github_repo_url' });

    // Parse owner/repo from URL
    const match = github_repo_url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return res.status(400).json({ error: 'Invalid GitHub URL' });
    const [, owner, repoName] = match;
    const cleanName = repoName.replace(/\.git$/, '');
    const fullName = `${owner}/${cleanName}`;

    // Check if already connected
    const { data: existing } = await supabase
      .from('repositories')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('full_name', fullName)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Repository already connected', repo_id: existing.id });
    }

    // Verify access via GitHub API
    try {
      await getRepoDetails(req.user.access_token, owner, cleanName);
    } catch {
      return res.status(403).json({ error: 'Cannot access this repository. Make sure you have access.' });
    }

    // Create repo record
    const { data: repo, error } = await supabase
      .from('repositories')
      .insert({
        user_id: req.user.id,
        github_repo_url: `https://github.com/${fullName}`,
        name: cleanName,
        full_name: fullName,
        status: 'connected',
        file_count: 0,
        node_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ repo });
  } catch (err) {
    console.error('Connect repo error:', err);
    res.status(500).json({ error: 'Failed to connect repository' });
  }
});

// GET /api/repos/:id - get single repo details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: repo, error } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !repo) return res.status(404).json({ error: 'Repository not found' });
    res.json({ repo });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get repository' });
  }
});

// DELETE /api/repos/:id - disconnect a repository
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Verify ownership
    const { data: repo } = await supabase
      .from('repositories')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    // Delete repo (cascades to jobs)
    const { error } = await supabase
      .from('repositories')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete repo error:', err);
    res.status(500).json({ error: 'Failed to delete repository' });
  }
});

export default router;
