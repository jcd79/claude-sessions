import { truncate, padRight, padLeft } from '../utils/text.js';
import { relativeDate } from '../utils/date.js';
import {
  repoColor, branchColor, promptColor, dateColor, msgColor,
  selectedBg, indicator, normalIndicator, dimText,
} from './theme.js';

const colorFns = {
  repoName: repoColor,
  gitBranch: branchColor,
  firstPrompt: promptColor,
  modified: dateColor,
  messageCount: msgColor,
};

/**
 * Render a single table row.
 */
export function renderRow(session, columns, isSelected, searchTerms) {
  const parts = columns.map(col => {
    let value = session[col.key];
    if (col.isDate) value = relativeDate(value);
    if (col.isNumber) value = String(value || 0);
    value = String(value || '');

    const truncated = truncate(value, col.width);
    const padded = col.isNumber
      ? padLeft(truncated, col.width)
      : padRight(truncated, col.width);

    if (isSelected) return padded; // color applied to whole line
    const colorFn = colorFns[col.key] || (s => s);
    return colorFn(padded);
  });

  const prefix = isSelected ? indicator : normalIndicator;
  const line = prefix + ' ' + parts.join(' ');

  if (isSelected) {
    return selectedBg(line);
  }
  return line;
}

/**
 * Render a range of table rows.
 */
export function renderTable(sessions, columns, selectedIndex, startIndex, count) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    if (idx >= sessions.length) {
      rows.push(''); // empty line for padding
    } else {
      rows.push(renderRow(sessions[idx], columns, idx === selectedIndex));
    }
  }
  return rows;
}
