const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type FetchOptions = RequestInit & {
  skipAuth?: boolean;
};

/**
 * Get stored auth token.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('thinksync_token');
}

/**
 * Store auth token.
 */
export function setToken(token: string): void {
  localStorage.setItem('thinksync_token', token);
}

/**
 * Clear auth token.
 */
export function clearToken(): void {
  localStorage.removeItem('thinksync_token');
  localStorage.removeItem('thinksync_user');
}

/**
 * Store user data.
 */
export function setUser(user: any): void {
  localStorage.setItem('thinksync_user', JSON.stringify(user));
}

/**
 * Get stored user data.
 */
export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('thinksync_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/**
 * Core fetch wrapper with auth header injection.
 */
async function apiFetch<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/api/auth')) {
      window.location.href = '/';
    }
    throw new Error('Authentication required');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── Auth ───────────────────────────────────────────────────
export const api = {
  auth: {
    getGitHubUrl: () =>
      apiFetch<{ url: string }>('/api/auth/github', { skipAuth: true }),

    callback: (code: string) =>
      apiFetch<{ token: string; user: any }>('/api/auth/github/callback', {
        method: 'POST',
        body: JSON.stringify({ code }),
        skipAuth: true,
      }),

    me: () =>
      apiFetch<{ user: any }>('/api/auth/me'),

    logout: () =>
      apiFetch<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
  },

  // ─── Repos ──────────────────────────────────────────────────
  repos: {
    list: () =>
      apiFetch<{ repos: any[] }>('/api/repos'),

    listGitHub: () =>
      apiFetch<{ repos: any[] }>('/api/repos/github'),

    connect: (githubRepoUrl: string) =>
      apiFetch<{ repo: any }>('/api/repos/connect', {
        method: 'POST',
        body: JSON.stringify({ github_repo_url: githubRepoUrl }),
      }),

    get: (id: string) =>
      apiFetch<{ repo: any }>(`/api/repos/${id}`),

    delete: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/repos/${id}`, { method: 'DELETE' }),

    reindex: (id: string) =>
      apiFetch<{ success: boolean; job_id: string }>(`/api/repos/${id}/reindex`, { method: 'POST' }),

    getGraph: (id: string) =>
      apiFetch<any>(`/api/repos/${id}/graph`),
  },

  // ─── Jobs ───────────────────────────────────────────────────
  jobs: {
    get: (id: string) =>
      apiFetch<{ job: any }>(`/api/jobs/${id}`),

    list: (params?: { repo_id?: string; type?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.repo_id) qs.set('repo_id', params.repo_id);
      if (params?.type) qs.set('type', params.type);
      if (params?.limit) qs.set('limit', params.limit.toString());
      const query = qs.toString();
      return apiFetch<{ jobs: any[] }>(`/api/jobs${query ? `?${query}` : ''}`);
    },
  },

  // ─── Analyze (intent → plan) ─────────────────────────────────
  analyze: {
    submit: (repoId: string, intent: string) =>
      apiFetch<{ job_id: string }>('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ repo_id: repoId, intent }),
      }),

    getResult: (jobId: string) =>
      apiFetch<{ job: any; result: any; repo: any }>(`/api/analyze/${jobId}`),
  },

  // ─── Health ─────────────────────────────────────────────────
  health: () =>
    apiFetch<{ status: string }>('/health', { skipAuth: true }),
};
