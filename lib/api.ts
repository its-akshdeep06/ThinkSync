const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

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
 * Custom error class for API errors with extra context.
 */
export class ApiError extends Error {
  status: number;
  isNetworkError: boolean;

  constructor(message: string, status: number = 0, isNetworkError: boolean = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Core fetch wrapper with auth header injection and robust error handling.
 */
async function apiFetch<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  const hasBody = fetchOptions.body !== undefined && fetchOptions.body !== null;
  const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
  if (hasBody && !isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    res = await fetch(`${API_BASE}${normalizedPath}`, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    });
  } catch (err: any) {
    // Network error — backend is unreachable
    throw new ApiError(
      'Cannot connect to the server. Please make sure the backend is running.',
      0,
      true
    );
  }

  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/api/auth')) {
      window.location.href = '/';
    }
    throw new ApiError('Authentication required', 401);
  }

  if (!res.ok) {
    const body = await res
      .json()
      .catch(async () => ({ error: (await res.text().catch(() => '')) || res.statusText }));
    throw new ApiError(body.error || `Request failed: ${res.status}`, res.status);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json().catch(() => ({} as T));
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
      apiFetch<{ success: boolean; job_id?: string }>(`/api/repos/${id}/reindex`, { method: 'POST' }),

    getGraph: (id: string) =>
      apiFetch<{ files: string[]; nodes: any[]; edges: any[]; stats: any }>(`/api/repos/${id}/graph`),
  },

  // ─── Analyze (Intent → Plan → PR) ────────────────────────
  analyze: {
    submit: (repoId: string, intentText: string) =>
      apiFetch<{ job_id: string }>('/api/analyze/submit', {
        method: 'POST',
        body: JSON.stringify({ repo_id: repoId, intent_text: intentText }),
      }),

    getResult: (jobId: string) =>
      apiFetch<{ job: any; result: any; repo: any }>(`/api/analyze/${jobId}/result`),
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

  // ─── Analyze ─────────────────────────────────────────────────
  analyze: {
    submit: (repoId: string, intent: string) =>
      apiFetch<{ job_id: string }>('/api/analyze/submit', {
        method: 'POST',
        body: JSON.stringify({ repo_id: repoId, intent }),
      }),

    getResult: (jobId: string) =>
      apiFetch<{ result: any }>(`/api/analyze/result/${jobId}`),
  },
};
