/**
 * Course YAML validation logic
 */

import { parse as parseYaml } from 'js-yaml';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
  summary?: {
    title: string;
    slug: string;
    price: number;
    currency: string;
    lessonCount: number;
    freeCount: number;
    paidCount: number;
    quizCount: number;
    sandboxCount: number;
  };
}

const VALID_CURRENCIES = ['usd', 'eur', 'gbp', 'cad', 'aud', 'jpy', 'chf', 'sek', 'nok', 'dkk'];
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

export function validateCourseYml(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  let parsed: Record<string, unknown>;
  try {
    parsed = parseYaml(content) as Record<string, unknown>;
  } catch (err) {
    return { valid: false, errors: [`YAML parse error: ${(err as Error).message}`], warnings, info };
  }

  // Required fields
  if (!parsed.title) errors.push('Missing required field: title');
  if (!parsed.slug) errors.push('Missing required field: slug');
  if (parsed.price_cents === undefined || parsed.price_cents === null) errors.push('Missing required field: price_cents');
  if (!parsed.currency) errors.push('Missing required field: currency');
  if (!parsed.lessons) errors.push('Missing required field: lessons');

  // Slug format
  if (parsed.slug && !SLUG_REGEX.test(String(parsed.slug))) {
    errors.push(`Invalid slug "${parsed.slug}": must be lowercase alphanumeric with hyphens, no leading/trailing hyphens`);
  }

  // Price
  if (parsed.price_cents !== undefined) {
    const price = Number(parsed.price_cents);
    if (!Number.isInteger(price) || price < 0) {
      errors.push(`Invalid price_cents: must be a non-negative integer, got ${parsed.price_cents}`);
    }
    if (price > 0 && price < 50) {
      warnings.push('price_cents is very low (< $0.50). Stripe minimum is $0.50.');
    }
  }

  // Currency
  if (parsed.currency && !VALID_CURRENCIES.includes(String(parsed.currency).toLowerCase())) {
    warnings.push(`Unknown currency "${parsed.currency}". Common values: usd, eur, gbp`);
  }

  // Lessons
  let freeCount = 0;
  let paidCount = 0;
  let quizCount = 0;
  let sandboxCount = 0;

  if (Array.isArray(parsed.lessons)) {
    if (parsed.lessons.length === 0) {
      errors.push('lessons array is empty — add at least one lesson');
    }

    for (let i = 0; i < parsed.lessons.length; i++) {
      const lesson = parsed.lessons[i] as Record<string, unknown>;
      const prefix = `lessons[${i}]`;

      if (!lesson.filename) errors.push(`${prefix}: missing required field "filename"`);
      if (!lesson.title) errors.push(`${prefix}: missing required field "title"`);
      if (!lesson.access) errors.push(`${prefix}: missing required field "access"`);

      if (lesson.access && !['free', 'paid'].includes(String(lesson.access))) {
        errors.push(`${prefix}: invalid access "${lesson.access}" — must be "free" or "paid"`);
      }

      if (lesson.access === 'free') freeCount++;
      if (lesson.access === 'paid') paidCount++;

      // Validate quiz
      if (lesson.quiz) {
        quizCount++;
        if (Array.isArray(lesson.quiz)) {
          for (let qi = 0; qi < lesson.quiz.length; qi++) {
            const q = lesson.quiz[qi] as Record<string, unknown>;
            const qprefix = `${prefix}.quiz[${qi}]`;

            if (!q.q && !q.question) errors.push(`${qprefix}: missing "q" field`);
            if (!Array.isArray(q.options)) errors.push(`${qprefix}: "options" must be an array`);
            if (!q.answer) errors.push(`${qprefix}: missing "answer" field`);

            if (Array.isArray(q.options) && q.answer) {
              if (!q.options.includes(q.answer)) {
                errors.push(`${qprefix}: "answer" must be one of the options. Got: "${q.answer}"`);
              }
            }
          }
        }
      }

      // Validate sandbox
      if (lesson.sandbox) {
        sandboxCount++;
        const sb = lesson.sandbox as Record<string, unknown>;
        if (!['stackblitz', 'codesandbox'].includes(String(sb.provider))) {
          errors.push(`${prefix}.sandbox: provider must be "stackblitz" or "codesandbox"`);
        }
        if (!sb.repo) warnings.push(`${prefix}.sandbox: missing "repo" — sandbox will not load`);
      }
    }

    if (freeCount === 0) {
      warnings.push('No free lessons found. Consider making the first lesson free to let students preview your content.');
    }
  }

  const valid = errors.length === 0;

  if (valid && freeCount > 0) {
    info.push(`${freeCount} free lesson${freeCount > 1 ? 's' : ''} will be accessible without purchase`);
  }

  return {
    valid,
    errors,
    warnings,
    info,
    summary: valid ? {
      title: String(parsed.title ?? ''),
      slug: String(parsed.slug ?? ''),
      price: Number(parsed.price_cents ?? 0),
      currency: String(parsed.currency ?? 'usd'),
      lessonCount: freeCount + paidCount,
      freeCount,
      paidCount,
      quizCount,
      sandboxCount,
    } : undefined,
  };
}
