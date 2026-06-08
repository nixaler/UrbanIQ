export type Category = 'confession' | 'question' | 'unpopular_opinion';

export const CATEGORY_META: Record<Category, { label: string; color: string; bg: string }> = {
  confession:         { label: '🤫 Confession',        color: '#a78bfa', bg: 'rgba(124,58,237,0.15)' },
  question:           { label: '❓ Question',           color: '#60a5fa', bg: 'rgba(37,99,235,0.15)'  },
  unpopular_opinion:  { label: '🔥 Unpopular Opinion', color: '#f87171', bg: 'rgba(220,38,38,0.15)'  },
};

export const REACTIONS = ['❤️', '😂', '😮', '🔥', '💀'] as const;
export type ReactionEmoji = (typeof REACTIONS)[number];

export interface Confession {
  id: string;
  content: string;
  category: Category;
  created_at: string;
  reactions: Record<ReactionEmoji, number>;
}
