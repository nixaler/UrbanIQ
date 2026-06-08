import { NextResponse } from 'next/server';

/**
 * GET /api/content
 *
 * Aggregator endpoint — normalizes data from multiple sources into a
 * single response. Each source is fetched in parallel; failures are
 * isolated so one bad source doesn't kill the whole response.
 *
 * Add new source fetchers here as SDKs are integrated.
 */
export async function GET() {
  const [githubResult, notionResult] = await Promise.allSettled([
    fetchGitHubSummary(),
    fetchNotionSummary(),
  ]);

  return NextResponse.json({
    github: githubResult.status === 'fulfilled' ? githubResult.value : null,
    notion: notionResult.status === 'fulfilled' ? notionResult.value : null,
    _meta: {
      fetchedAt: new Date().toISOString(),
      sources: {
        github: githubResult.status,
        notion:  notionResult.status,
      },
    },
  });
}

async function fetchGitHubSummary() {
  const username = process.env.GITHUB_USERNAME;
  const token    = process.env.GITHUB_TOKEN; // server-only — never sent to client
  if (!username) return null;

  const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 300 }, // ISR: revalidate every 5 min
  });

  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json();
}

async function fetchNotionSummary() {
  const token      = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) return null;

  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      Authorization:   `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ page_size: 10 }),
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Notion API ${res.status}`);
  return res.json();
}
