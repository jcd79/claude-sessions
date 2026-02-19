import { extractRepoName } from '../utils/path.js';

/**
 * Clean up prompt text: strip XML/command tags, truncate interrupt markers, normalize whitespace.
 */
function cleanPrompt(raw) {
  if (!raw || raw === 'No prompt') return '(no prompt)';

  let text = raw;

  // Strip XML-style tags like <command-message>, <local-command-caveat>, etc.
  text = text.replace(/<[^>]+>/g, '');

  // Clean up "[Request interrupted by user..." to just "(interrupted)"
  if (text.startsWith('[Request interrupted')) {
    return '(interrupted)';
  }

  // Strip common verbose prefixes
  text = text.replace(/^Implement the following plan:\s*/i, '');
  text = text.replace(/^#{1,3}\s+/g, ''); // leading markdown headers

  // Strip leading/trailing whitespace and collapse internal whitespace
  text = text.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

  // If we stripped everything, show placeholder
  if (!text) return '(no prompt)';

  return text;
}

/**
 * Normalize a raw session entry from sessions-index.json into our internal model.
 */
export function normalizeSession(entry, sourceFile) {
  return {
    sessionId: entry.sessionId || '',
    projectPath: entry.projectPath || '',
    repoName: extractRepoName(entry.projectPath),
    gitBranch: entry.gitBranch || '(none)',
    firstPrompt: cleanPrompt(entry.firstPrompt),
    messageCount: entry.messageCount || 0,
    created: entry.created || '',
    modified: entry.modified || entry.created || '',
    sourceFile: sourceFile || '',
  };
}
