/**
 * teachrepo import — import a GitHub repo as a TeachRepo course
 */

import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import pc from 'picocolors';

interface ImportOptions {
  repo?: string;
  token?: string;
  baseUrl: string;
  dryRun?: boolean;
}

export function importCommand(): Command {
  return new Command('import')
    .description('Import a GitHub repository as a TeachRepo course')
    .option('--repo <url>', 'GitHub repository URL')
    .option('--token <token>', 'TeachRepo API token (or set TEACHREPO_TOKEN)')
    .option('--base-url <url>', 'TeachRepo API base URL', 'https://teachrepo.com')
    .option('--dry-run', 'Validate course.yml without importing')
    .action(async (opts: ImportOptions) => {
      const token = opts.token ?? process.env.TEACHREPO_TOKEN;
      const repoUrl = opts.repo;

      if (!repoUrl) {
        console.error(pc.red('Error: --repo is required'));
        console.error(pc.gray('  Example: teachrepo import --repo=https://github.com/you/your-course'));
        process.exit(1);
      }

      if (!token && !opts.dryRun) {
        console.error(pc.red('Error: --token is required (or set TEACHREPO_TOKEN env var)'));
        console.error(pc.gray('  Get your token at: ' + opts.baseUrl + '/dashboard/settings'));
        process.exit(1);
      }

      // Read local course.yml if it exists
      const courseYmlPath = resolve(process.cwd(), 'course.yml');
      let courseYml: string | undefined;
      if (existsSync(courseYmlPath)) {
        courseYml = readFileSync(courseYmlPath, 'utf-8');
        console.log(pc.gray('  Using local course.yml'));
      }

      console.log(pc.bold('TeachRepo Import'));
      console.log(pc.gray('  Repo: ') + repoUrl);
      console.log(pc.gray('  API:  ') + opts.baseUrl);

      if (opts.dryRun) {
        console.log(pc.yellow('  Mode: dry-run (validating only)'));
        // Run validation only
        const { validateCourseYml } = await import('../lib/validate.js');
        if (courseYml) {
          const result = validateCourseYml(courseYml);
          if (result.valid) {
            console.log(pc.green('\n✅ course.yml is valid'));
            result.warnings.forEach(w => console.log(pc.yellow('  ⚠  ' + w)));
          } else {
            console.error(pc.red('\n❌ Validation failed:'));
            result.errors.forEach(e => console.error(pc.red('  • ' + e)));
            process.exit(1);
          }
        }
        return;
      }

      try {
        console.log(pc.gray('\nImporting...'));
        const res = await fetch(`${opts.baseUrl}/api/import`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ repoUrl, courseYml }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as Record<string, unknown>;
          console.error(pc.red(`\n❌ Import failed (${res.status}): ${body.error ?? res.statusText}`));
          process.exit(1);
        }

        const data = await res.json() as Record<string, unknown>;
        console.log(pc.green('\n✅ Course imported successfully!'));
        console.log(pc.gray('  Course ID: ') + data.courseId);
        console.log(pc.gray('  Slug:      ') + data.slug);
        console.log(pc.gray('  URL:       ') + opts.baseUrl + '/courses/' + data.slug);

      } catch (err) {
        console.error(pc.red('\n❌ Network error: ' + (err as Error).message));
        process.exit(1);
      }
    });
}
