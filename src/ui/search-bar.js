import chalk from 'chalk';
import { sortLabels } from './theme.js';

/**
 * Render the search bar line.
 */
export function renderSearchBar(searchMode, searchText, sortIndex, termCols) {
  const sortLabel = sortLabels[sortIndex] || 'Date';
  const sortStr = chalk.dim(`Sort: ${sortLabel} ▾`);
  const sortVisLen = `Sort: ${sortLabel} ▾`.length;

  if (searchMode) {
    const prefix = chalk.yellow(' 🔍 Search: ');
    const cursor = chalk.yellow.underline(' ');
    const text = chalk.white(searchText);
    const leftVisLen = ` 🔍 Search: `.length + searchText.length + 1;
    const gap = Math.max(termCols - leftVisLen - sortVisLen - 2, 1);
    return prefix + text + cursor + ' '.repeat(gap) + sortStr;
  }

  const prefix = chalk.dim(' 🔍 Search: press / to search');
  const leftVisLen = ' 🔍 Search: press / to search'.length;
  const gap = Math.max(termCols - leftVisLen - sortVisLen - 2, 1);
  return prefix + ' '.repeat(gap) + sortStr;
}
