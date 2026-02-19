/**
 * Map a keypress event to an action name.
 */
export function resolveAction(key, searchMode) {
  if (!key) return null;

  const { name, ctrl, sequence } = key;

  // Ctrl+C always quits
  if (ctrl && name === 'c') return 'quit';

  if (searchMode) {
    // In search mode, most keys are text input
    if (name === 'escape') return 'exit-search';
    if (name === 'return') return 'exit-search';
    if (name === 'backspace') return 'search-backspace';
    if (name === 'up') return 'move-up';
    if (name === 'down') return 'move-down';
    // Printable character
    if (sequence && sequence.length === 1 && sequence.charCodeAt(0) >= 32) {
      return 'search-char';
    }
    return null;
  }

  // Normal mode
  switch (name) {
    case 'up': return 'move-up';
    case 'down': return 'move-down';
    case 'pageup': return 'page-up';
    case 'pagedown': return 'page-down';
    case 'home': return 'go-home';
    case 'end': return 'go-end';
    case 'return': return 'launch';
    case 'escape': return 'clear';
    case 'q': return 'quit';
  }

  // Vim-style navigation
  if (sequence === 'k') return 'move-up';
  if (sequence === 'j') return 'move-down';
  if (sequence === '/') return 'enter-search';
  if (sequence === 's' || sequence === 'S') return 'cycle-sort';
  if (sequence === 'r' || sequence === 'R') return 'refresh';
  if (sequence === 'g') return 'go-home';
  if (sequence === 'G') return 'go-end';

  return null;
}
