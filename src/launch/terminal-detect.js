/**
 * Detect the current terminal environment.
 */
export function detectTerminal() {
  const env = process.env;

  if (env.WT_SESSION) return 'windows-terminal';
  if (env.TERM_PROGRAM === 'iTerm.app') return 'iterm';
  if (env.TERM_PROGRAM === 'Apple_Terminal') return 'apple-terminal';
  if (env.KITTY_PID) return 'kitty';
  if (env.ALACRITTY_WINDOW_ID) return 'alacritty';
  if (env.WEZTERM_PANE) return 'wezterm';
  if (process.platform === 'win32') return 'windows-cmd';
  return 'generic';
}
