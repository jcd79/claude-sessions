import { loadAllSessions } from './data/loader.js';
import { readCache, writeCache } from './data/cache.js';
import { paintScreen } from './ui/renderer.js';
import { computeLayout } from './ui/layout.js';
import { setupKeyboard } from './input/keyboard.js';
import { resolveAction } from './input/keybindings.js';
import { fuzzySearch, invalidateIndex } from './search/fuzzy.js';
import { sortSessions, nextSortIndex } from './search/sort.js';
import { launchSession } from './launch/launcher.js';

/**
 * Application state.
 */
function createState() {
  return {
    sessions: [],           // all sessions, sorted
    filteredSessions: null,  // null = show all, array = filtered
    selectedIndex: 0,
    scrollOffset: 0,
    searchMode: false,
    searchText: '',
    sortIndex: 0,            // 0=date, 1=messages, 2=repo, 3=branch
    statusMessage: '',
    running: true,
  };
}

/**
 * Enter alternate screen buffer.
 */
function enterAltScreen() {
  process.stdout.write('\x1b[?1049h'); // enter alt screen
  process.stdout.write('\x1b[?25l');   // hide cursor
}

/**
 * Exit alternate screen buffer.
 */
function exitAltScreen() {
  process.stdout.write('\x1b[?25h');   // show cursor
  process.stdout.write('\x1b[?1049l'); // exit alt screen
}

/**
 * Get visible sessions list.
 */
function getVisible(state) {
  return state.filteredSessions || state.sessions;
}

/**
 * Get page size from terminal.
 */
function getPageSize() {
  const termRows = process.stdout.rows || 24;
  return computeLayout(termRows, process.stdout.columns || 80).tableRows;
}

/**
 * Clamp selection and scroll offset.
 */
function clampState(state) {
  const visible = getVisible(state);
  const len = visible.length;
  const pageSize = getPageSize();

  if (len === 0) {
    state.selectedIndex = 0;
    state.scrollOffset = 0;
    return;
  }

  // Clamp selection
  state.selectedIndex = Math.max(0, Math.min(state.selectedIndex, len - 1));

  // Ensure selection is visible
  if (state.selectedIndex < state.scrollOffset) {
    state.scrollOffset = state.selectedIndex;
  }
  if (state.selectedIndex >= state.scrollOffset + pageSize) {
    state.scrollOffset = state.selectedIndex - pageSize + 1;
  }

  // Clamp scroll offset
  state.scrollOffset = Math.max(0, Math.min(state.scrollOffset, Math.max(len - pageSize, 0)));
}

/**
 * Apply current search and sort to state.
 */
function applySearchAndSort(state) {
  const sorted = sortSessions(state.sessions, state.sortIndex);
  state.sessions = sorted;

  if (state.searchText) {
    state.filteredSessions = fuzzySearch(sorted, state.searchText);
  } else {
    state.filteredSessions = null;
  }

  clampState(state);
}

/**
 * Show a temporary status message.
 */
function flashStatus(state, msg, duration = 2000) {
  state.statusMessage = msg;
  paintScreen(state);
  setTimeout(() => {
    state.statusMessage = '';
    if (state.running) paintScreen(state);
  }, duration);
}

/**
 * Handle a resolved action.
 */
function handleAction(action, state, key, cleanupKeyboard) {
  const visible = getVisible(state);
  const pageSize = getPageSize();

  switch (action) {
    case 'move-up':
      state.selectedIndex = Math.max(0, state.selectedIndex - 1);
      clampState(state);
      break;

    case 'move-down':
      state.selectedIndex = Math.min(visible.length - 1, state.selectedIndex + 1);
      clampState(state);
      break;

    case 'page-up':
      state.selectedIndex = Math.max(0, state.selectedIndex - pageSize);
      state.scrollOffset = Math.max(0, state.scrollOffset - pageSize);
      clampState(state);
      break;

    case 'page-down':
      state.selectedIndex = Math.min(visible.length - 1, state.selectedIndex + pageSize);
      state.scrollOffset = Math.min(
        Math.max(visible.length - pageSize, 0),
        state.scrollOffset + pageSize
      );
      clampState(state);
      break;

    case 'go-home':
      state.selectedIndex = 0;
      state.scrollOffset = 0;
      break;

    case 'go-end':
      state.selectedIndex = Math.max(0, visible.length - 1);
      clampState(state);
      break;

    case 'enter-search':
      state.searchMode = true;
      state.searchText = '';
      break;

    case 'exit-search':
      state.searchMode = false;
      // Keep the search text and results
      break;

    case 'clear':
      if (state.searchText) {
        state.searchText = '';
        state.filteredSessions = null;
        state.selectedIndex = 0;
        state.scrollOffset = 0;
      }
      break;

    case 'search-char':
      if (key && key.sequence) {
        state.searchText += key.sequence;
        applySearchAndSort(state);
        state.selectedIndex = 0;
        state.scrollOffset = 0;
      }
      break;

    case 'search-backspace':
      if (state.searchText.length > 0) {
        state.searchText = state.searchText.slice(0, -1);
        applySearchAndSort(state);
        state.selectedIndex = 0;
        state.scrollOffset = 0;
      }
      break;

    case 'cycle-sort':
      state.sortIndex = nextSortIndex(state.sortIndex);
      applySearchAndSort(state);
      state.selectedIndex = 0;
      state.scrollOffset = 0;
      flashStatus(state, `Sort: ${['Date', 'Messages', 'Repo', 'Branch'][state.sortIndex]}`);
      return; // flashStatus already paints

    case 'refresh':
      flashStatus(state, 'Refreshing...');
      loadAllSessions().then(sessions => {
        invalidateIndex();
        state.sessions = sessions;
        applySearchAndSort(state);
        writeCache(sessions);
        flashStatus(state, `Loaded ${sessions.length} sessions`);
      });
      return; // async, don't paint now

    case 'launch': {
      const session = visible[state.selectedIndex];
      if (!session) break;
      const result = launchSession(session, () => {
        cleanupKeyboard();
        exitAltScreen();
      });
      if (result.method === 'windows-terminal') {
        flashStatus(state, `Launched in new tab: ${session.repoName}`);
        return;
      }
      // in-place launch exits the app
      return;
    }

    case 'quit':
      state.running = false;
      cleanupKeyboard();
      exitAltScreen();
      process.exit(0);
      break;
  }

  paintScreen(state);
}

/**
 * Main application entry point.
 */
export async function run() {
  const state = createState();

  // Load data: try cache first, then disk
  const cached = await readCache();
  if (cached && cached.length > 0) {
    state.sessions = cached;
    applySearchAndSort(state);
  }

  // Enter alternate screen
  enterAltScreen();

  // Initial paint (may be empty or cached)
  paintScreen(state);

  // Set up keyboard
  const cleanupKeyboard = setupKeyboard((str, key) => {
    if (!state.running) return;
    const action = resolveAction(key, state.searchMode);
    if (action) {
      handleAction(action, state, key, cleanupKeyboard);
    }
  });

  // Handle terminal resize
  process.stdout.on('resize', () => {
    if (state.running) {
      clampState(state);
      paintScreen(state);
    }
  });

  // Handle clean exit
  const cleanup = () => {
    if (state.running) {
      state.running = false;
      cleanupKeyboard();
      exitAltScreen();
    }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });

  // Load fresh data from disk (in background if we had cache)
  try {
    const sessions = await loadAllSessions();
    state.sessions = sessions;
    invalidateIndex();
    applySearchAndSort(state);
    writeCache(sessions);
    if (state.running) {
      if (!cached || cached.length === 0) {
        flashStatus(state, `Loaded ${sessions.length} sessions`);
      }
      paintScreen(state);
    }
  } catch (err) {
    if (state.running) {
      flashStatus(state, `Error loading sessions: ${err.message}`);
    }
  }
}
