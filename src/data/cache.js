import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CACHE_PATH = join(homedir(), '.claude-sessions-cache.json');
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Read cached sessions if the cache is fresh (< 5 min old).
 * Returns null if cache is stale or missing.
 */
export async function readCache() {
  try {
    const raw = await readFile(CACHE_PATH, 'utf-8');
    const data = JSON.parse(raw);
    if (data.timestamp && Date.now() - data.timestamp < CACHE_TTL) {
      return data.sessions || [];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Write sessions to cache.
 */
export async function writeCache(sessions) {
  try {
    const data = { timestamp: Date.now(), sessions };
    await writeFile(CACHE_PATH, JSON.stringify(data), 'utf-8');
  } catch {
    // Cache write failure is non-fatal
  }
}
