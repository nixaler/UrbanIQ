import { fileURLToPath } from 'node:url';
import path from 'node:path';
import withSerwistInit from '@serwist/next';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Only registered in production builds — a dev-mode service worker would
  // otherwise cache stale HMR output and make local development confusing.
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app has its own package-lock.json but sits inside the UrbanIQ repo,
  // which also has a root-level lockfile for the unrelated trivia game.
  // Pin the tracing root here so Next doesn't guess wrong between the two.
  outputFileTracingRoot: __dirname,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default withSerwist(nextConfig);
