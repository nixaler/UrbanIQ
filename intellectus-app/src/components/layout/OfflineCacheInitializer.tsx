'use client';

import { useOfflineCache } from '@/hooks/useOfflineCache';

export default function OfflineCacheInitializer() {
  useOfflineCache();
  return null;
}
