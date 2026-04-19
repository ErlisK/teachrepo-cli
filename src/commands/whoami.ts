/**
 * teachrepo whoami — show authenticated user
 */

import { Command } from 'commander';
import pc from 'picocolors';

interface WhoamiOptions {
  token?: string;
  baseUrl: string;
}

export function whoamiCommand(): Command {
  return new Command('whoami')
    .description('Show the authenticated TeachRepo user')
    .option('--token <token>', 'TeachRepo API token (or set TEACHREPO_TOKEN)')
    .option('--base-url <url>', 'TeachRepo API base URL', 'https://teachrepo.com')
    .action(async (opts: WhoamiOptions) => {
      const token = opts.token ?? process.env.TEACHREPO_TOKEN;

      if (!token) {
        console.error(pc.red('Error: not authenticated'));
        console.error(pc.gray('  Set TEACHREPO_TOKEN or use --token'));
        console.error(pc.gray('  Get your token at: ' + opts.baseUrl + '/dashboard/settings'));
        process.exit(1);
      }

      try {
        const res = await fetch(`${opts.baseUrl}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.status === 401) {
          console.error(pc.red('Error: invalid or expired token'));
          console.error(pc.gray('  Get a new token at: ' + opts.baseUrl + '/dashboard/settings'));
          process.exit(1);
        }

        if (!res.ok) {
          console.error(pc.red(`Error: ${res.status} ${res.statusText}`));
          process.exit(1);
        }

        const user = await res.json() as Record<string, unknown>;
        console.log(pc.green('✅ Authenticated'));
        console.log(pc.gray('  User:   ') + user.email);
        console.log(pc.gray('  Plan:   ') + (user.plan ?? 'free'));
        console.log(pc.gray('  API:    ') + opts.baseUrl);

      } catch (err) {
        console.error(pc.red('Network error: ' + (err as Error).message));
        process.exit(1);
      }
    });
}
