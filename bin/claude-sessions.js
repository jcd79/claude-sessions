#!/usr/bin/env node

import { run } from '../src/app.js';

run().catch(err => {
  // Ensure we exit alt screen on unhandled error
  process.stdout.write('\x1b[?25h\x1b[?1049l');
  console.error('Fatal error:', err);
  process.exit(1);
});
