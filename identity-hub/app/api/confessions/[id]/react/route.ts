import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { REACTIONS, type ReactionEmoji } from '@/types/confession';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  let body: { emoji?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { emoji } = body;
  if (!emoji || !(REACTIONS as readonly string[]).includes(emoji)) {
    return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Atomic increment via raw SQL — avoids race conditions
  const { error } = await supabase.rpc('increment_reaction', {
    confession_id: id,
    emoji_key:     emoji as ReactionEmoji,
  });

  if (error) {
    // Fallback: manual read-modify-write (less safe under high concurrency, fine for MVP)
    const { data: row } = await supabase
      .from('confessions')
      .select('reactions')
      .eq('id', id)
      .single();

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = {
      ...(row.reactions as Record<string, number>),
      [emoji]: ((row.reactions as Record<string, number>)[emoji] ?? 0) + 1,
    };

    await supabase.from('confessions').update({ reactions: updated }).eq('id', id);
  }

  return NextResponse.json({ ok: true });
}
