#!/usr/bin/env node
// @teachrepo/cli entry point
// This file is the binary; actual implementation is in src/

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load the compiled CLI
const { run } = await import(join(__dirname, '../dist/index.js'));
await run();
