import { spawn } from 'node:child_process';
import { detectTerminal } from './terminal-detect.js';

/**
 * Launch a Claude session.
 * On Windows Terminal: opens a new tab.
 * Otherwise: exits alt screen and runs claude in the current terminal.
 */
export function launchSession(session, exitAltScreen) {
  const { sessionId, projectPath, repoName, gitBranch } = session;
  const terminal = detectTerminal();
  const title = `Claude: ${repoName}@${gitBranch}`;

  if (terminal === 'windows-terminal') {
    return launchWindowsTerminal(sessionId, projectPath, title, exitAltScreen);
  }

  // Fallback: run in current terminal
  return launchInPlace(sessionId, projectPath, exitAltScreen);
}

function launchWindowsTerminal(sessionId, projectPath, title, exitAltScreen) {
  const claudeCmd = `claude --resume ${sessionId} --dangerously-skip-permissions`;

  // Use wt.exe to open a new tab
  const args = [
    'new-tab',
    '--title', title,
    '-d', projectPath,
    'cmd', '/c', claudeCmd,
  ];

  try {
    const child = spawn('wt.exe', args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    });
    child.unref();
    return { success: true, method: 'windows-terminal' };
  } catch (err) {
    // Fall back to in-place launch
    return launchInPlace(sessionId, projectPath, exitAltScreen);
  }
}

function launchInPlace(sessionId, projectPath, exitAltScreen) {
  // Exit alternate screen and restore terminal
  exitAltScreen();

  const args = ['--resume', sessionId, '--dangerously-skip-permissions'];

  try {
    const child = spawn('claude', args, {
      stdio: 'inherit',
      cwd: projectPath,
      shell: true,
    });

    child.on('error', (err) => {
      console.error(`Failed to launch claude: ${err.message}`);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });

    return { success: true, method: 'in-place' };
  } catch (err) {
    console.error(`Failed to launch: ${err.message}`);
    return { success: false, error: err.message };
  }
}
