/**
 * Sort modes and cycling.
 */
export const SORT_MODES = ['date', 'messages', 'repo', 'branch'];

/**
 * Sort sessions by the given mode.
 * Returns a new sorted array.
 */
export function sortSessions(sessions, sortIndex) {
  const mode = SORT_MODES[sortIndex] || 'date';
  const sorted = [...sessions];

  switch (mode) {
    case 'date':
      sorted.sort((a, b) => {
        const da = a.modified || a.created || '';
        const db = b.modified || b.created || '';
        return db.localeCompare(da); // newest first
      });
      break;
    case 'messages':
      sorted.sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0));
      break;
    case 'repo':
      sorted.sort((a, b) => (a.repoName || '').localeCompare(b.repoName || ''));
      break;
    case 'branch':
      sorted.sort((a, b) => (a.gitBranch || '').localeCompare(b.gitBranch || ''));
      break;
  }

  return sorted;
}

/**
 * Cycle to the next sort mode.
 */
export function nextSortIndex(current) {
  return (current + 1) % SORT_MODES.length;
}
