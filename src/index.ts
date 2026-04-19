/**
 * @teachrepo/cli — main entry point
 *
 * Commands:
 *   import   — import a GitHub repo as a TeachRepo course
 *   validate — validate a course.yml file
 *   new      — scaffold a new course from template
 *   whoami   — show authenticated user
 */

import { Command } from 'commander';
import { importCommand } from './commands/import.js';
import { validateCommand } from './commands/validate.js';
import { newCommand } from './commands/new.js';
import { whoamiCommand } from './commands/whoami.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

export async function run() {
  const program = new Command();

  program
    .name('teachrepo')
    .description('TeachRepo CLI — import repos, validate course YAML, scaffold courses')
    .version(pkg.version);

  program.addCommand(importCommand());
  program.addCommand(validateCommand());
  program.addCommand(newCommand());
  program.addCommand(whoamiCommand());

  await program.parseAsync(process.argv);
}
