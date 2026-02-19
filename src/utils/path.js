import { basename } from 'node:path';

/**
 * Extract a short repo name from a project path.
 * e.g. "C:\\source\\repos\\my-app" → "my-app"
 *      "/home/user/projects/cool-lib" → "cool-lib"
 */
export function extractRepoName(projectPath) {
  if (!projectPath) return '(unknown)';
  // Normalize separators and remove trailing slash
  const normalized = projectPath.replace(/\\/g, '/').replace(/\/+$/, '');
  const name = basename(normalized);
  // If the path is a root like "C:" or "/", return the whole thing
  return name || normalized;
}
