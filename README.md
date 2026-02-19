# claude-sessions

Terminal UI for browsing and resuming [Claude Code](https://docs.anthropic.com/en/docs/claude-code) sessions.

```
╭──────────────────────────────────────────────────────────────────────────────╮
│  CLAUDE SESSIONS                                               284 sessions  │
╰──────────────────────────────────────────────────────────────────────────────╯
 🔍 Search: _                                                     Sort: Date ▾

  REPO             BRANCH              FIRST PROMPT                DATE     MSG
────────────────────────────────────────────────────────────────────────────────
▸ my-app           feat/auth           Add OAuth2 login flow..     2h ago    12
  my-app           develop             Fix the build error..       1d ago    66
  api-service      main                Update the identity..       3d ago     8
  website          feat/dark-mode      Implement dark theme..      5d ago    24

────────────────────────────────────────────────────────────────────────────────
 ↑↓ Navigate  Enter Launch  / Search  S Sort  R Refresh  Q Quit       pg 1/10
```

## Features

- **Browse all sessions** — Scans every `sessions-index.json` + orphan `.jsonl` files in `~/.claude/projects/`
- **Fuzzy search** — Press `/` and type to filter by repo, branch, prompt, or project path
- **Sortable** — Cycle through Date / Messages / Repo / Branch with `S`
- **Instant resume** — Press `Enter` to launch `claude --resume <id> --dangerously-skip-permissions`
- **New tab** — On Windows Terminal, sessions open in a new tab in the correct project folder
- **Fast startup** — Sessions are cached locally; reopening the app is near-instant
- **Cross-platform** — Works on Windows, macOS, and Linux
- **Gradient header, color-coded columns** — Looks good in any modern terminal

## Requirements

- **Node.js** 18 or later
- **Claude Code** CLI installed and on your PATH (`npm install -g @anthropic-ai/claude-code`)
- **Windows Terminal** (optional, for new-tab support on Windows)

## Installation

```bash
git clone https://github.com/jcd79/claude-sessions.git
cd claude-sessions
npm install
npm link
```

After `npm link`, two commands are available globally:

| Command | Description |
|---------|-------------|
| `claude-sessions` | Full name |
| `cs` | Short alias |

Open any terminal and type `cs` to launch.

### Uninstall

```bash
npm unlink -g claude-sessions
```

## Usage

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `↑` / `k` | Move up |
| `↓` / `j` | Move down |
| `PgUp` / `PgDn` | Scroll by page |
| `Home` / `g` | Jump to top |
| `End` / `G` | Jump to bottom |
| `Enter` | Resume selected session |
| `/` | Start searching |
| `Esc` | Exit search mode |
| `S` | Cycle sort mode |
| `R` | Refresh sessions from disk |
| `Q` / `Ctrl+C` | Quit |

### How it finds sessions

Claude Code stores session data in `~/.claude/projects/`. Each subdirectory represents a project (encoded path), and contains:

1. **`sessions-index.json`** — A manifest with session metadata (ID, branch, first prompt, timestamps, message count)
2. **`*.jsonl`** — Individual session conversation logs

The app reads all `sessions-index.json` files first, then scans for any `.jsonl` files not already indexed (orphan sessions). Results are deduplicated by session ID.

### How resume works

When you press `Enter` on a session:

- **Windows Terminal** (`WT_SESSION` detected): Opens a new tab via `wt.exe new-tab -d <project-dir> cmd /c claude --resume <id> --dangerously-skip-permissions`
- **Other terminals**: Exits the TUI and runs `claude --resume <id> --dangerously-skip-permissions` in the current terminal, with `cwd` set to the session's project directory

### Caching

On first launch, the app reads all session index files from disk and writes a merged cache to `~/.claude-sessions-cache.json`. On subsequent launches (within 5 minutes), it loads from cache instantly and refreshes in the background. Press `R` to force a refresh.

## How it's built

Zero build step. Plain ES modules (`.js` files with `"type": "module"` in `package.json`).

**Dependencies** (just 2):

| Package | Purpose |
|---------|---------|
| [chalk](https://github.com/chalk/chalk) | Terminal colors and styling |
| [fuse.js](https://github.com/krisk/Fuse) | Fuzzy search |

Everything else — keyboard input, screen rendering, layout — uses Node.js built-ins (`readline`, ANSI escape sequences, alternate screen buffer).

## License

MIT
