import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app has its own package-lock.json but sits inside the UrbanIQ repo,
  // which also has a root-level lockfile for the unrelated trivia game and a
  // sibling lockfile for intellectus-app. Pin the tracing root here so Next
  // doesn't guess wrong between them.
  outputFileTracingRoot: __dirname,
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
