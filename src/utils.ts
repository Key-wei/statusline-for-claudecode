/**
 * Truncate a string to maxLen, appending "..." if truncated.
 */
export function truncate(str: string, max_len: number): string {
  if (str.length <= max_len) return str;
  return str.slice(0, max_len - 3) + '...';
}

/**
 * Format current local time as HH:MM.
 */
export function formatTime(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Safely execute a function, returning fallback on error.
 */
export function safeExec<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}
