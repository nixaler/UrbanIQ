// All default to "off" — only flip once the underlying feature is ready.
export const featureFlags = {
  karmaEnabled: process.env.NEXT_PUBLIC_KARMA_ENABLED === 'true',
  donationsEnabled: process.env.NEXT_PUBLIC_DONATIONS_ENABLED === 'true',
  // Real-time avatar/face-masking video filter — a stretch goal requiring a
  // face-landmark model + canvas/WebGL overlay pipeline, not built yet.
  cameraMaskingEnabled: process.env.NEXT_PUBLIC_CAMERA_MASKING_ENABLED === 'true',
} as const;
