import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/content/github?username=<user>
 *
 * Thin, server-side proxy to the GitHub REST API.
 * The GitHub token stays in server env — it is never exposed to the client.
 */
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username');
  if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN;

  const res = await fetch(
    `https://api.github.com/users/${username}/repos?sort=updated&per_page=6`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 300 },
    },
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `GitHub returned ${res.status}` },
      { status: res.status === 404 ? 404 : 502 },
    );
  }

  const raw = await res.json();

  // Normalize: only expose the fields tiles need
  const repos = (raw as Record<string, unknown>[]).map((r) => ({
    id:               r.id,
    name:             r.name,
    description:      r.description,
    stargazers_count: r.stargazers_count,
    language:         r.language,
    html_url:         r.html_url,
  }));

  return NextResponse.json({ username, repos });
}
