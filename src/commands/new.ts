/**
 * teachrepo new — scaffold a new course from template
 */

import { Command } from 'commander';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import pc from 'picocolors';

type Template = 'basic' | 'quiz' | 'sandbox';

interface NewOptions {
  template: Template;
  slug?: string;
}

const TEMPLATES: Record<Template, string> = {
  basic: 'Basic course — lessons only, no quizzes or sandboxes',
  quiz: 'Quiz course — lessons with auto-graded quizzes',
  sandbox: 'Sandbox course — lessons with live code environments',
};

function toKebabCase(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function newCommand(): Command {
  return new Command('new')
    .description('Scaffold a new course from the official template')
    .argument('<course-name>', 'Name of the new course')
    .option('--template <t>', 'Template: basic | quiz | sandbox', 'basic')
    .option('--slug <slug>', 'URL slug (default: kebab-case of course-name)')
    .action((courseName: string, opts: NewOptions) => {
      const slug = opts.slug ?? toKebabCase(courseName);
      const dir = slug;

      if (existsSync(dir)) {
        console.error(pc.red(`Error: directory "${dir}" already exists`));
        process.exit(1);
      }

      console.log(pc.bold('\nTeachRepo New Course'));
      console.log(pc.gray('  Name:     ') + courseName);
      console.log(pc.gray('  Slug:     ') + slug);
      console.log(pc.gray('  Template: ') + opts.template + pc.gray(` — ${TEMPLATES[opts.template] ?? ''}`));
      console.log('');

      // Create directory structure
      mkdirSync(dir);
      mkdirSync(join(dir, 'lessons'));
      mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });

      // course.yml
      writeFileSync(join(dir, 'course.yml'), generateCourseYml(courseName, slug, opts.template));

      // Lesson files
      writeFileSync(join(dir, 'lessons', '01-introduction.md'), generateLesson('Introduction', 'free'));
      writeFileSync(join(dir, 'lessons', '02-core-concepts.md'), generateLesson('Core Concepts', 'paid', opts.template));
      writeFileSync(join(dir, 'lessons', '03-advanced.md'), generateLesson('Advanced Patterns', 'paid', opts.template));
      writeFileSync(join(dir, 'lessons', '04-conclusion.md'), generateLesson('Conclusion & Next Steps', 'paid'));

      // Supporting files
      writeFileSync(join(dir, '.env.example'), ENV_EXAMPLE);
      writeFileSync(join(dir, '.gitignore'), GITIGNORE);
      writeFileSync(join(dir, 'LICENSE'), MIT_LICENSE);
      writeFileSync(join(dir, '.github', 'workflows', 'deploy.yml'), CI_WORKFLOW);
      writeFileSync(join(dir, 'README.md'), generateReadme(courseName, slug));

      console.log(pc.green('✅ Course scaffolded at ./' + dir + '/'));
      console.log('');
      console.log(pc.bold('Next steps:'));
      console.log('  1. ' + pc.cyan(`cd ${dir}`));
      console.log('  2. Edit ' + pc.cyan('course.yml') + ' with your course details');
      console.log('  3. Write your lessons in ' + pc.cyan('lessons/'));
      console.log('  4. Push to GitHub and import with ' + pc.cyan('teachrepo import'));
      console.log('');
      console.log(pc.gray('  Docs: https://teachrepo.com/docs/quickstart'));
    });
}

function generateCourseYml(title: string, slug: string, _template: Template): string {
  return `title: "${title}"
slug: "${slug}"
price_cents: 2900
currency: usd
version: "1.0.0"
description: |
  Describe your course here. What will students learn?
  Who is this course for?
repo_url: "https://github.com/yourname/${slug}"
tags: [your-tag]

lessons:
  - filename: lessons/01-introduction.md
    title: "Introduction"
    access: free

  - filename: lessons/02-core-concepts.md
    title: "Core Concepts"
    access: paid

  - filename: lessons/03-advanced.md
    title: "Advanced Patterns"
    access: paid

  - filename: lessons/04-conclusion.md
    title: "Conclusion & Next Steps"
    access: paid
`;
}

function generateLesson(title: string, access: 'free' | 'paid', template?: Template): string {
  const frontmatter: Record<string, unknown> = { title, access };

  if (template === 'quiz' && access === 'paid') {
    frontmatter.quiz = [
      {
        q: 'Example quiz question?',
        options: ['Option A', 'Option B (correct)', 'Option C', 'Option D'],
        answer: 'Option B (correct)',
        explanation: 'Replace this with a clear explanation of why Option B is correct.',
      },
    ];
  }

  if (template === 'sandbox' && title.includes('Advanced')) {
    frontmatter.sandbox = {
      provider: 'stackblitz',
      repo: 'yourname/your-course',
      branch: 'lesson-03-starter',
      file: 'src/index.ts',
      height: 550,
    };
  }

  const yaml = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n');

  return `---\n${yaml}\n---\n\n# ${title}\n\nLesson content here.\n`;
}

function generateReadme(title: string, slug: string): string {
  return `# ${title}

A course built with [TeachRepo](https://teachrepo.com).

## Quick Start

\`\`\`bash
npm install -g @teachrepo/cli
teachrepo import --repo=https://github.com/yourname/${slug}
\`\`\`

## License

MIT
`;
}

const ENV_EXAMPLE = `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://your-domain.com
TEACHREPO_TOKEN=tr_...
`;

const GITIGNORE = `.env.local\n.env.*.local\nnode_modules/\n.next/\ndist/\n*.log\n.DS_Store\n.vercel\n`;

const MIT_LICENSE = `MIT License\n\nCopyright (c) ${new Date().getFullYear()}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n`;

const CI_WORKFLOW = `name: Deploy to TeachRepo\non:\n  push:\n    branches: [main]\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm install -g @teachrepo/cli\n      - run: teachrepo import --repo="\${{ github.repositoryUrl }}"\n        env:\n          TEACHREPO_TOKEN: \${{ secrets.TEACHREPO_TOKEN }}\n`;
