-- ThinkSync Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gdolnvvlzgmhwvtfpswz/sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  github_id BIGINT UNIQUE NOT NULL,
  login TEXT NOT NULL,
  avatar_url TEXT,
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  github_repo_url TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  installation_id TEXT,
  indexed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'indexing', 'ready', 'error')),
  file_count INTEGER DEFAULT 0,
  node_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ingest-repository', 'analyze-intent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'complete', 'failed')),
  progress_pct INTEGER DEFAULT 0,
  intent_text TEXT,
  pr_url TEXT,
  pr_number INTEGER,
  outcome JSONB,
  error_msg TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_repos_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_repo_id ON jobs(repo_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);

-- Disable RLS for service role access (backend uses service key)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON repositories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON jobs FOR ALL USING (true) WITH CHECK (true);
