/**
 * teachrepo validate — validate a course.yml file
 */

import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import pc from 'picocolors';
import { validateCourseYml } from '../lib/validate.js';

interface ValidateOptions {
  file: string;
  verbose?: boolean;
}

export function validateCommand(): Command {
  return new Command('validate')
    .description('Validate a course.yml file')
    .option('--file <path>', 'Path to course.yml', './course.yml')
    .option('--verbose', 'Show detailed validation output')
    .action((opts: ValidateOptions) => {
      const filePath = resolve(process.cwd(), opts.file);

      if (!existsSync(filePath)) {
        console.error(pc.red(`Error: course.yml not found at ${filePath}`));
        console.error(pc.gray('  Run this command from your course root, or use --file=<path>'));
        process.exit(1);
      }

      const content = readFileSync(filePath, 'utf-8');
      const result = validateCourseYml(content);

      if (opts.verbose) {
        console.log(pc.bold('\nTeachRepo Validation'));
        console.log(pc.gray('  File: ') + filePath);
        console.log('');
      }

      if (result.valid) {
        console.log(pc.green('✅ course.yml is valid'));

        if (opts.verbose && result.info.length > 0) {
          console.log('');
          result.info.forEach(i => console.log(pc.gray('  ℹ  ' + i)));
        }

        if (result.warnings.length > 0) {
          console.log('');
          result.warnings.forEach(w => console.log(pc.yellow('  ⚠  ' + w)));
        }

        if (opts.verbose) {
          console.log('\n' + pc.bold('Course summary:'));
          if (result.summary) {
            console.log(pc.gray('  Title:   ') + result.summary.title);
            console.log(pc.gray('  Slug:    ') + result.summary.slug);
            console.log(pc.gray('  Price:   ') + (result.summary.price === 0 ? 'Free' : `$${(result.summary.price / 100).toFixed(2)} ${result.summary.currency.toUpperCase()}`));
            console.log(pc.gray('  Lessons: ') + result.summary.lessonCount + ` (${result.summary.freeCount} free, ${result.summary.paidCount} paid)`);
            console.log(pc.gray('  Quizzes: ') + result.summary.quizCount);
            console.log(pc.gray('  Sandboxes: ') + result.summary.sandboxCount);
          }
        }
      } else {
        console.error(pc.red('❌ Validation failed:'));
        console.log('');
        result.errors.forEach(e => console.error(pc.red('  • ' + e)));

        if (result.warnings.length > 0) {
          console.log('');
          result.warnings.forEach(w => console.log(pc.yellow('  ⚠  ' + w)));
        }

        process.exit(1);
      }
    });
}
