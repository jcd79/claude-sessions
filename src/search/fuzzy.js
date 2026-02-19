import Fuse from 'fuse.js';

let fuseInstance = null;
let lastSessions = null;

const FUSE_OPTIONS = {
  keys: [
    { name: 'firstPrompt', weight: 0.40 },
    { name: 'repoName', weight: 0.25 },
    { name: 'gitBranch', weight: 0.20 },
    { name: 'projectPath', weight: 0.15 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
};

/**
 * Perform fuzzy search over sessions.
 * Returns filtered array (original objects).
 */
export function fuzzySearch(sessions, query) {
  if (!query || query.trim() === '') return null; // null = show all

  // Rebuild Fuse index if sessions changed
  if (sessions !== lastSessions) {
    fuseInstance = new Fuse(sessions, FUSE_OPTIONS);
    lastSessions = sessions;
  }

  const results = fuseInstance.search(query);
  return results.map(r => r.item);
}

/**
 * Invalidate the Fuse index (call after data refresh).
 */
export function invalidateIndex() {
  fuseInstance = null;
  lastSessions = null;
}
