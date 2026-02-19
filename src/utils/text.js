/**
 * Truncate a string to maxLen, adding ".." if truncated.
 */
export function truncate(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  if (maxLen <= 2) return str.slice(0, maxLen);
  return str.slice(0, maxLen - 2) + '..';
}

/**
 * Pad/truncate a string to exactly `width` characters (right-padded).
 */
export function padRight(str, width) {
  const s = str || '';
  if (s.length >= width) return s.slice(0, width);
  return s + ' '.repeat(width - s.length);
}

/**
 * Pad a string to `width` characters (left-padded).
 */
export function padLeft(str, width) {
  const s = str || '';
  if (s.length >= width) return s.slice(0, width);
  return ' '.repeat(width - s.length) + s;
}

/**
 * Strip ANSI escape codes from a string to get its visible length.
 */
export function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Get the visible length of a string (excluding ANSI codes).
 */
export function visibleLength(str) {
  return stripAnsi(str).length;
}
