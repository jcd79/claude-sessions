import { readdir, readFile, open, access, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { normalizeSession } from './session.js';

const HEAD_BYTES = 32768; // read first 32KB of each JSONL to find metadata

/**
 * Check if a firstPrompt value from the index is unhelpful and needs recovery.
 */
function needsBetterPrompt(prompt) {
  if (!prompt || prompt === 'No prompt') return true;
  if (prompt.startsWith('[Request interrupted')) return true;
  if (prompt.startsWith('<')) return true;
  return false;
}

/**
 * Read just the first prompt from a JSONL file (32KB head only, no full-file read).
 */
async function recoverFirstPrompt(filePath) {
  let fh;
  try {
    const fileStat = await stat(filePath);
    fh = await open(filePath, 'r');
    const buf = Buffer.alloc(Math.min(HEAD_BYTES, fileStat.size));
    await fh.read(buf, 0, buf.length, 0);
    const chunk = buf.toString('utf-8');
    const lines = chunk.split('\n').filter(l => l.trim());

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.type === 'user' && obj.userType === 'external' && obj.message) {
          const content = obj.message.content;
          let text = '';
          if (typeof content === 'string') {
            text = content;
          } else if (Array.isArray(content)) {
            const textPart = content.find(p => p.type === 'text');
            if (textPart) text = textPart.text || '';
          }
          if (text && !needsBetterPrompt(text)) return text;
        }
      } catch {
        // JSON parse failed — line may be truncated. Try regex on raw text.
        if (line.includes('"userType":"external"') && line.includes('"type":"user"')) {
          const match = line.match(/"content"\s*:\s*"((?:[^"\\]|\\.){10,200})/);
          if (match) {
            const text = match[1].replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            if (!needsBetterPrompt(text)) return text;
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    if (fh) await fh.close().catch(() => {});
  }
}

/**
 * Parse a JSONL file to extract session metadata.
 * Reads only the first chunk to find the first user message, plus uses file stats.
 */
async function parseJsonlSession(filePath, dirName) {
  let fh;
  try {
    const fileStat = await stat(filePath);
    fh = await open(filePath, 'r');
    const buf = Buffer.alloc(Math.min(HEAD_BYTES, fileStat.size));
    await fh.read(buf, 0, buf.length, 0);
    const chunk = buf.toString('utf-8');
    const lines = chunk.split('\n').filter(l => l.trim());

    let sessionId = '';
    let projectPath = '';
    let gitBranch = '';
    let firstPrompt = '';
    let firstTimestamp = '';

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.type === 'user' && obj.sessionId) {
          if (!sessionId) sessionId = obj.sessionId;
          if (!projectPath && obj.cwd) projectPath = obj.cwd;
          if (!gitBranch && obj.gitBranch) gitBranch = obj.gitBranch;
          if (!firstTimestamp && obj.timestamp) firstTimestamp = obj.timestamp;

          // Extract first prompt text from first external user message
          if (!firstPrompt && obj.userType === 'external' && obj.message) {
            const content = obj.message.content;
            let text = '';
            if (typeof content === 'string') {
              text = content;
            } else if (Array.isArray(content)) {
              const textPart = content.find(p => p.type === 'text');
              if (textPart) text = textPart.text || '';
            }
            if (text && !needsBetterPrompt(text)) firstPrompt = text;
          }

          // Once we have everything, stop
          if (sessionId && projectPath && firstPrompt) break;
        }
      } catch {
        // JSON parse failed — line may be truncated. Try regex on raw text.
        if (!firstPrompt && line.includes('"userType":"external"') && line.includes('"type":"user"')) {
          const match = line.match(/"content"\s*:\s*"((?:[^"\\]|\\.){10,200})/);
          if (match) {
            const text = match[1].replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            if (!needsBetterPrompt(text)) firstPrompt = text;
          }
        }
      }
    }

    if (!sessionId) return null;

    // For message count, do a quick full-file line count of user+assistant types
    // Read full file only for counting (still fast since it's just string scanning)
    const fullContent = await readFile(filePath, 'utf-8');
    const allLines = fullContent.split('\n');
    let messageCount = 0;
    for (const l of allLines) {
      // Quick check without full JSON parse
      if (l.includes('"type":"user"') || l.includes('"type":"assistant"')) {
        messageCount++;
      }
    }

    return {
      sessionId,
      projectPath,
      gitBranch,
      firstPrompt,
      messageCount,
      created: firstTimestamp || fileStat.birthtime.toISOString(),
      modified: fileStat.mtime.toISOString(),
    };
  } catch {
    return null;
  } finally {
    if (fh) await fh.close().catch(() => {});
  }
}

/**
 * Discover and load all sessions from both sessions-index.json and JSONL files.
 */
export async function loadAllSessions() {
  const claudeDir = join(homedir(), '.claude', 'projects');
  const sessions = [];

  let projectDirs;
  try {
    projectDirs = await readdir(claudeDir, { withFileTypes: true });
  } catch {
    return sessions;
  }

  const promises = projectDirs
    .filter(d => d.isDirectory())
    .map(async (dir) => {
      const dirPath = join(claudeDir, dir.name);
      const dirSessions = [];
      const indexedIds = new Set();

      // 1. Load from sessions-index.json if it exists
      const indexPath = join(dirPath, 'sessions-index.json');
      try {
        await access(indexPath);
        const raw = await readFile(indexPath, 'utf-8');
        const data = JSON.parse(raw);
        const entries = data.entries || [];

        // Recover bad prompts from JSONL files in parallel
        await Promise.all(entries.map(async (e) => {
          if (needsBetterPrompt(e.firstPrompt) && e.sessionId) {
            const jsonlPath = join(dirPath, e.sessionId + '.jsonl');
            const recovered = await recoverFirstPrompt(jsonlPath);
            if (recovered) e.firstPrompt = recovered;
          }
        }));

        for (const e of entries) {
          dirSessions.push(normalizeSession(e, indexPath));
          if (e.sessionId) indexedIds.add(e.sessionId);
        }
      } catch {
        // no index file, that's fine
      }

      // 2. Scan for JSONL files not already in the index
      try {
        const files = await readdir(dirPath);
        const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

        const jsonlPromises = jsonlFiles.map(async (f) => {
          const sessionIdFromFilename = f.replace('.jsonl', '');
          if (indexedIds.has(sessionIdFromFilename)) return null;

          const filePath = join(dirPath, f);
          const entry = await parseJsonlSession(filePath, dir.name);
          if (!entry) return null;

          // Also skip if the parsed sessionId was already indexed
          // (filename might differ from internal sessionId)
          if (indexedIds.has(entry.sessionId)) return null;

          return normalizeSession(entry, filePath);
        });

        const jsonlResults = await Promise.all(jsonlPromises);
        for (const s of jsonlResults) {
          if (s) dirSessions.push(s);
        }
      } catch {
        // couldn't read directory
      }

      return dirSessions;
    });

  const results = await Promise.all(promises);
  for (const batch of results) {
    sessions.push(...batch);
  }

  // Deduplicate by sessionId (keep the one with latest modified date)
  const byId = new Map();
  for (const s of sessions) {
    const existing = byId.get(s.sessionId);
    if (!existing || s.modified > existing.modified) {
      byId.set(s.sessionId, s);
    }
  }

  return Array.from(byId.values());
}

/**
 * Check if a project path exists on disk.
 */
export async function projectExists(projectPath) {
  try {
    const s = await stat(projectPath);
    return s.isDirectory();
  } catch {
    return false;
  }
}
