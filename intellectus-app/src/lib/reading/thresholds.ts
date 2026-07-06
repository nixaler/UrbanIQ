// Read-to-Unlock Gate (#1): both conditions must hold before comments unlock.
// Scroll and time are checked server-side in the Server Action that persists
// reading_progress — client-reported values are inputs, not the verdict.
const READING_WPM = 200;
const MIN_SECONDS_FLOOR = 10;

export const READ_GATE_SCROLL_THRESHOLD = 0.85;

export function computeMinReadSeconds(wordCount: number): number {
  return Math.max(MIN_SECONDS_FLOOR, Math.round((wordCount / READING_WPM) * 60));
}
