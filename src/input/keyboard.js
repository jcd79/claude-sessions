import readline from 'node:readline';

/**
 * Set up raw keyboard input and call handler on each keypress.
 * Returns a cleanup function.
 */
export function setupKeyboard(handler) {
  readline.emitKeypressEvents(process.stdin);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();

  const listener = (str, key) => {
    handler(str, key);
  };

  process.stdin.on('keypress', listener);

  return () => {
    process.stdin.removeListener('keypress', listener);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
  };
}
