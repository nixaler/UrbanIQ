'use client';

import { useEffect, useState } from 'react';
import type { GitHubConfig } from '@/types/tile';

interface Repo {
  id: number;
  name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  html_url: string;
}

export default function GitHubTile({ config }: { config: Record<string, unknown> }) {
  const { username } = config as GitHubConfig;
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/content/github?username=${encodeURIComponent(username)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data: { repos: Repo[] }) => setRepos(data.repos ?? []))
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [username]);

  return (
    <div className="tile-shell">
      <div className="tile-header">GitHub · {username}</div>
      <div className="tile-body">
        {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>}
        {error && <p style={{ color: 'var(--color-accent)' }}>Error: {error}</p>}
        {!loading && !error && repos.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)' }}>No public repos found.</p>
        )}
        <ul className="flex flex-col gap-2">
          {repos.map((repo) => (
            <li
              key={repo.id}
              className="p-2 rounded"
              style={{ border: '1px solid var(--color-border)', borderRadius: 'calc(var(--tile-radius) / 2)' }}
            >
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sm"
                style={{ color: 'var(--color-accent)' }}
              >
                {repo.name}
              </a>
              {repo.description && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {repo.description}
                </p>
              )}
              <div className="flex gap-3 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {repo.language && <span>{repo.language}</span>}
                <span>★ {repo.stargazers_count}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
