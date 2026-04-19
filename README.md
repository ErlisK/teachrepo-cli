# @teachrepo/cli

[![npm](https://img.shields.io/npm/v/@teachrepo/cli?style=flat-square)](https://www.npmjs.com/package/@teachrepo/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)
[![TeachRepo](https://img.shields.io/badge/powered%20by-TeachRepo-6d28d9?style=flat-square)](https://teachrepo.com)

**Official TeachRepo CLI.** Import repos, validate course YAML, and scaffold new courses from your terminal.

```bash
npm install -g @teachrepo/cli
teachrepo --help
```

---

## Commands

### `teachrepo import`

Import a GitHub repository as a course on TeachRepo.

```bash
teachrepo import [options]

Options:
  --repo <url>      GitHub repository URL (required)
  --token <token>   TeachRepo API token (or set TEACHREPO_TOKEN env var)
  --base-url <url>  TeachRepo API base URL (default: https://teachrepo.com)
  --dry-run         Validate without importing
  -h, --help        Show help

Examples:
  teachrepo import --repo=https://github.com/you/your-course
  teachrepo import --repo=https://github.com/you/your-course --dry-run
  TEACHREPO_TOKEN=tr_xxx teachrepo import --repo=https://github.com/you/your-course
```

### `teachrepo validate`

Validate a `course.yml` file without importing.

```bash
teachrepo validate [options]

Options:
  --file <path>   Path to course.yml (default: ./course.yml)
  --verbose       Show detailed validation output
  -h, --help      Show help

Examples:
  teachrepo validate
  teachrepo validate --file=./my-course.yml --verbose
```

Validation checks:
- ✅ Required fields present (`title`, `slug`, `price_cents`, `currency`, `lessons`)
- ✅ Slug format (lowercase alphanumeric + hyphens)
- ✅ Price is a non-negative integer
- ✅ Currency is a valid 3-letter ISO code
- ✅ All referenced lesson files exist
- ✅ Lesson access is `free` or `paid`
- ✅ Quiz answer keys are valid (answer must be in options array)
- ✅ Sandbox provider is `stackblitz` or `codesandbox`

### `teachrepo new`

Scaffold a new course from the official template.

```bash
teachrepo new <course-name> [options]

Arguments:
  course-name     Name of the new course (will become the directory name)

Options:
  --template <t>  Template to use: basic | quiz | sandbox (default: basic)
  --slug <slug>   URL slug (default: kebab-case of course-name)
  -h, --help      Show help

Examples:
  teachrepo new "Advanced Git for Engineers"
  teachrepo new "Python Async" --template=sandbox
  teachrepo new "React Patterns" --slug=react-patterns --template=quiz
```

### `teachrepo whoami`

Show the authenticated user.

```bash
teachrepo whoami

# Output:
# Authenticated as: your@email.com
# Plan: hosted ($19/mo)
# API URL: https://teachrepo.com
```

## Authentication

Set your TeachRepo API token as an environment variable:

```bash
export TEACHREPO_TOKEN=tr_your_token_here
```

Or pass it directly with `--token`.

Get your token at [teachrepo.com/dashboard/settings](https://teachrepo.com/dashboard/settings).

## Installation

```bash
# Global install (recommended)
npm install -g @teachrepo/cli

# Or use with npx (no install)
npx @teachrepo/cli import --repo=https://github.com/you/your-course
```

## GitHub Actions Integration

The CLI is designed to run in CI. See the [teachrepo-template](https://github.com/ErlisK/teachrepo-template/blob/main/.github/workflows/deploy.yml) for the full workflow.

```yaml
- name: Import course to TeachRepo
  env:
    TEACHREPO_TOKEN: ${{ secrets.TEACHREPO_TOKEN }}
  run: |
    npm install -g @teachrepo/cli
    teachrepo import --repo="${{ github.repositoryUrl }}"
```

## Configuration

The CLI reads from `.teachrepo.json` in the project root (optional):

```json
{
  "baseUrl": "https://teachrepo.com",
  "courseFile": "course.yml"
}
```

## Contributing

Issues and PRs welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE)

---

**[teachrepo.com](https://teachrepo.com)** · [Docs](https://teachrepo.com/docs/cli) · [Template](https://github.com/ErlisK/teachrepo-template)
