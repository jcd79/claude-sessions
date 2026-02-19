/**
 * Compute layout regions based on terminal dimensions.
 * Returns the number of visible rows for the session table.
 */
export function computeLayout(termRows, termCols) {
  // Header: 3 lines (box)
  // Search bar: 1 line
  // Column headers: 1 line
  // Separator: 1 line
  // Bottom separator: 1 line
  // Status bar: 1 line
  // Total chrome = 8 lines
  const chromeLines = 8;
  const tableRows = Math.max(termRows - chromeLines, 3);

  return {
    termRows,
    termCols,
    tableRows,
    chromeLines,
  };
}

/**
 * Compute column widths given terminal width.
 */
export function computeColumns(termCols) {
  // Reserve space: indicator(2) + gaps between columns(4 spaces for 5 cols)
  const available = termCols - 2 - 4;

  // Proportions: repo=18%, branch=18%, prompt=40%, date=12%, msg=6%
  const repoW = Math.max(Math.floor(available * 0.16), 8);
  const branchW = Math.max(Math.floor(available * 0.18), 8);
  const dateW = Math.max(8, 8);
  const msgW = Math.max(4, 4);
  const promptW = Math.max(available - repoW - branchW - dateW - msgW, 10);

  return [
    { key: 'repoName', header: 'REPO', width: repoW },
    { key: 'gitBranch', header: 'BRANCH', width: branchW },
    { key: 'firstPrompt', header: 'FIRST PROMPT', width: promptW },
    { key: 'modified', header: 'DATE', width: dateW, isDate: true },
    { key: 'messageCount', header: 'MSG', width: msgW, isNumber: true },
  ];
}
