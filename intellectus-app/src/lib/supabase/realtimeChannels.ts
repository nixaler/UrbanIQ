import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Public comment stream for an article.
 *
 * IMPORTANT: the `filter` string below is a convenience, not a security
 * boundary. Supabase Realtime's Postgres Changes stream reads from the WAL,
 * bypassing any `WHERE` clause your app-level queries apply — a client that
 * ignores this filter would otherwise still receive every row, including
 * shadow-banned comments. The actual enforcement is Row Level Security on
 * `comments` for the `supabase_realtime` publication (see
 * drizzle/rls/comments_realtime.sql), which the database evaluates per
 * subscriber regardless of what filter string the client requests.
 *
 * A shadow-banned user's OWN comments are rendered from local optimistic
 * client state (see useOptimisticComment in the comment composer), never
 * from this public channel — so the ban stays invisible to them without
 * ever asking the public channel to leak their row.
 */
export function subscribeToPublicComments(
  supabase: SupabaseClient,
  articleId: string,
  onInsert: (payload: unknown) => void,
) {
  const channel = supabase
    .channel(`public-comments:${articleId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `article_id=eq.${articleId}`,
      },
      (payload) => onInsert(payload.new),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
