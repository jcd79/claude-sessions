import chalk from 'chalk';

// Column colors — tailwind-inspired palette
export const repoColor = chalk.hex('#60a5fa');       // soft blue
export const branchColor = chalk.hex('#34d399');     // emerald
export const promptColor = chalk.hex('#9ca3af');     // gray-400
export const dateColor = chalk.hex('#fbbf24');       // amber
export const msgColor = chalk.hex('#f472b6');        // pink
export const headerLabel = chalk.white.bold;
export const dimText = chalk.hex('#6b7280');
export const searchHighlight = chalk.hex('#fbbf24').underline;
export const selectedBg = chalk.bgHex('#2e1065').white.bold;
export const indicator = chalk.hex('#a855f7').bold('▸');
export const normalIndicator = ' ';
export const missingMarker = chalk.dim('(missing)');
export const statusText = chalk.dim;

// Sort labels
export const sortLabels = ['Date', 'Messages', 'Repo', 'Branch'];

// Box drawing
export const box = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
};

// Gradient color stops as RGB arrays for smooth interpolation
const gradientColors = [
  [99, 102, 241],   // indigo #6366f1
  [124, 58, 237],   // violet #7c3aed
  [168, 85, 247],   // purple #a855f7
  [192, 38, 211],   // fuchsia #c026d3
  [217, 70, 239],   // pink-fuchsia #d946ef
];

/**
 * Apply a smooth gradient across the characters of a string.
 */
export function gradientText(text) {
  const chars = [...text];
  const len = chars.length;
  if (len === 0) return '';
  if (len === 1) return chalk.rgb(...gradientColors[0])(text);

  const segments = gradientColors.length - 1;
  return chars.map((ch, i) => {
    const t = i / (len - 1);
    const segment = Math.min(Math.floor(t * segments), segments - 1);
    const localT = (t * segments) - segment;
    const c0 = gradientColors[segment];
    const c1 = gradientColors[segment + 1];
    const r = Math.round(c0[0] + (c1[0] - c0[0]) * localT);
    const g = Math.round(c0[1] + (c1[1] - c0[1]) * localT);
    const b = Math.round(c0[2] + (c1[2] - c0[2]) * localT);
    return chalk.rgb(r, g, b)(ch);
  }).join('');
}

/**
 * Render the header box.
 */
export function renderHeader(width, sessionCount) {
  const title = 'CLAUDE SESSIONS';
  const countStr = `${sessionCount} sessions`;
  const innerWidth = Math.max(width - 2, title.length + countStr.length + 6);

  const gradTitle = gradientText(title);
  const titleVisLen = title.length;
  const countVisLen = countStr.length;
  const padding = Math.max(innerWidth - titleVisLen - countVisLen - 4, 0);

  const boxColor = chalk.hex('#4c1d95'); // deep purple border
  const countBadge = chalk.hex('#7c3aed')(countStr);

  const topLine = boxColor(box.topLeft + box.horizontal.repeat(innerWidth) + box.topRight);
  const midLine = boxColor(box.vertical) + '  ' + gradTitle + ' '.repeat(padding) + countBadge + '  ' + boxColor(box.vertical);
  const botLine = boxColor(box.bottomLeft + box.horizontal.repeat(innerWidth) + box.bottomRight);

  return [topLine, midLine, botLine];
}

/**
 * Render column header line.
 */
export function renderColumnHeaders(columns) {
  return columns.map(col => headerLabel(col.header.padEnd(col.width))).join(' ');
}

/**
 * Render the separator line.
 */
export function renderSeparator(width) {
  return chalk.dim('─'.repeat(width));
}

// Keybinding styling for the footer
const keyStyle = chalk.hex('#a855f7').bold;
const descStyle = chalk.hex('#6b7280');
const statusHighlight = chalk.hex('#fbbf24');

function keyHint(key, desc) {
  return keyStyle(key) + descStyle(` ${desc}`);
}

/**
 * Render status bar with colored keybindings.
 */
export function renderStatusBar(width, page, totalPages, statusMessage) {
  if (statusMessage) {
    return ' ' + statusHighlight(statusMessage);
  }

  const hints = [
    keyHint('↑↓', 'Navigate'),
    keyHint('Enter', 'Launch'),
    keyHint('/', 'Search'),
    keyHint('S', 'Sort'),
    keyHint('R', 'Refresh'),
    keyHint('Q', 'Quit'),
  ];
  const left = ' ' + hints.join(descStyle('  '));
  const pageStr = descStyle(`pg ${page}/${totalPages}`);

  // Calculate visible lengths (strip ANSI)
  const strip = s => s.replace(/\x1b\[[0-9;]*m/g, '');
  const leftLen = strip(left).length;
  const rightLen = strip(pageStr).length;
  const gap = Math.max(width - leftLen - rightLen - 1, 1);
  return left + ' '.repeat(gap) + pageStr;
}
