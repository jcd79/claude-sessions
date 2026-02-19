import { renderHeader, renderColumnHeaders, renderSeparator, renderStatusBar } from './theme.js';
import { renderSearchBar } from './search-bar.js';
import { renderTable } from './table.js';
import { computeLayout, computeColumns } from './layout.js';

/**
 * Render the entire screen to a string.
 */
export function renderScreen(state) {
  const { sessions, filteredSessions, selectedIndex, scrollOffset,
          searchMode, searchText, sortIndex, statusMessage } = state;

  const termCols = process.stdout.columns || 80;
  const termRows = process.stdout.rows || 24;
  const layout = computeLayout(termRows, termCols);
  const columns = computeColumns(termCols);

  const displaySessions = filteredSessions || sessions;
  const totalSessions = displaySessions.length;
  const totalPages = Math.max(Math.ceil(totalSessions / layout.tableRows), 1);
  const currentPage = Math.floor(scrollOffset / layout.tableRows) + 1;

  const lines = [];

  // Header box
  const headerLines = renderHeader(termCols, totalSessions);
  lines.push(...headerLines);

  // Search bar
  lines.push(renderSearchBar(searchMode, searchText, sortIndex, termCols));

  // Column headers + separator
  const colHeaderLine = '  ' + renderColumnHeaders(columns);
  lines.push(colHeaderLine);
  lines.push(renderSeparator(termCols));

  // Table rows
  const tableRows = renderTable(
    displaySessions, columns, selectedIndex, scrollOffset, layout.tableRows
  );
  lines.push(...tableRows);

  // Bottom separator + status bar
  lines.push(renderSeparator(termCols));
  lines.push(renderStatusBar(termCols, currentPage, totalPages, statusMessage));

  return lines.join('\n');
}

/**
 * Write screen to stdout using alternate screen buffer positioning.
 */
export function paintScreen(state) {
  const output = renderScreen(state);
  // Move cursor to top-left and clear screen, then write
  process.stdout.write('\x1b[H\x1b[J' + output);
}
