import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Local-First Caching Framework (#30): precaches the app shell so the
// reading UI itself loads with zero network, while `useOfflineCache`
// (src/hooks/useOfflineCache.ts) separately writes the day's actual
// article content into IndexedDB — the service worker handles the shell,
// IndexedDB handles the data, matching the "silent background fetch"
// requirement without conflating the two caching layers.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
