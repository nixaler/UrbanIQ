import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app has its own package-lock.json but sits inside the UrbanIQ repo,
  // which also has root-level and intellectus-app lockfiles for the other two
  // unrelated apps. Pin the tracing root here so Next doesn't guess wrong.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
