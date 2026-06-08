import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import type { Category } from '@/types/confession';

const VALID_CATEGORIES: Category[] = ['confession', 'question', 'unpopular_opinion'];

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category') as Category | null;

  const supabase = createServiceClient();
  let query = supabase
    .from('confessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (category && VALID_CATEGORIES.includes(category)) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ confessions: data });
}

export async function POST(req: NextRequest) {
  let body: { content?: string; category?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { content, category } = body;

  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Content required' }, { status: 400 });
  }
  const trimmed = content.trim();
  if (trimmed.length < 10 || trimmed.length > 500) {
    return NextResponse.json({ error: 'Content must be 10–500 characters' }, { status: 400 });
  }
  if (!category || !VALID_CATEGORIES.includes(category as Category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('confessions')
    .insert({ content: trimmed, category })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ confession: data }, { status: 201 });
}
