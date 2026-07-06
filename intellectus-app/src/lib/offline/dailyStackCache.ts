import { get, set } from 'idb-keyval';

const CACHE_KEY = 'intellectus:daily-stack';

export interface CachedDailyStack {
  cachedAt: string;
  stack: Array<{
    id: string;
    title: string;
    publishDate: string;
    topicName: string;
    blocks: Array<{ blockType: string; depthLevel: string; body: unknown }>;
  }>;
}

export async function saveDailyStackToCache(data: CachedDailyStack): Promise<void> {
  await set(CACHE_KEY, data);
}

export async function loadDailyStackFromCache(): Promise<CachedDailyStack | undefined> {
  return get<CachedDailyStack>(CACHE_KEY);
}
