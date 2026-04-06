import { Router } from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../db.js';
import { getGitHubUser } from '../lib/github.js';

const router = Router();
const isProduction = process.env.NODE_ENV === 'production';

// GET /api/auth/github - redirect to GitHub OAuth
router.get('/github', (req, res) => {
  const state = Buffer.from(JSON.stringify({
    ts: Date.now(),
    r: Math.random().toString(36).substring(7),
  })).toString('base64');

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.FRONTEND_URL}/api/auth/callback`,
    scope: 'repo user read:org',
    state,
  });
  res.json({ url: `https://github.com/login/oauth/authorize?${params}` });
});

// POST /api/auth/github/callback - exchange code for token
router.post('/github/callback', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing code' });

    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description || tokenData.error });
    }

    const accessToken = tokenData.access_token;

    // Get GitHub user info
    const ghUser = await getGitHubUser(accessToken);

    // Upsert user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        {
          github_id: ghUser.id,
          login: ghUser.login,
          avatar_url: ghUser.avatar_url,
          access_token: accessToken,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'github_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    // Create JWT
    const token = jwt.sign(
      { userId: user.id, githubId: user.github_id, login: user.login },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      token,
      user: {
        id: user.id,
        login: user.login,
        avatar_url: user.avatar_url,
        github_id: user.github_id,
      },
    });
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/me - get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user } = await supabase
      .from('users')
      .select('id, github_id, login, avatar_url, created_at')
      .eq('id', decoded.userId)
      .single();

    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/',
  });
  res.json({ success: true });
});

export default router;
