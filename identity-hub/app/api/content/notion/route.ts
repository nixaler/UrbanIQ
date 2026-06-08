import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/content/notion?database=<id>
 *
 * Proxies a Notion database query server-side.
 * Notion integration token is server-only (never reaches the client).
 */
export async function GET(req: NextRequest) {
  const databaseId = req.nextUrl.searchParams.get('database') ?? process.env.NOTION_DATABASE_ID;
  const token      = process.env.NOTION_TOKEN;

  if (!token)      return NextResponse.json({ error: 'Notion not configured' }, { status: 503 });
  if (!databaseId) return NextResponse.json({ error: 'Missing database id' },   { status: 400 });

  // Basic UUID-ish validation to prevent SSRF
  if (!/^[a-f0-9-]{32,36}$/.test(databaseId)) {
    return NextResponse.json({ error: 'Invalid database id' }, { status: 400 });
  }

  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      Authorization:    `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type':   'application/json',
    },
    body: JSON.stringify({ page_size: 20 }),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Notion returned ${res.status}` },
      { status: res.status === 404 ? 404 : 502 },
    );
  }

  const raw = await res.json() as { results: Record<string, unknown>[] };

  // Normalize to a flat list — extend as your Notion schema evolves
  const items = raw.results.map((page) => ({
    id:         page.id,
    // @ts-expect-error Notion property shape varies per database
    title:      page.properties?.Name?.title?.[0]?.plain_text ?? '(untitled)',
    // @ts-expect-error
    status:     page.properties?.Status?.select?.name ?? null,
    // @ts-expect-error
    lastEdited: page.last_edited_time,
  }));

  return NextResponse.json({ databaseId, items });
}
