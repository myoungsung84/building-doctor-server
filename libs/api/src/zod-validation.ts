import { z } from 'zod';

import { ApiException } from './api-error';
import type { ApiErrorDetail } from './api-response';

function toErrorDetails(issues: z.ZodIssue[]): ApiErrorDetail[] {
  return issues.map((issue) => ({
    ...(issue.path.length > 0 ? { field: issue.path.join('.') } : {}),
    reason: issue.message,
  }));
}

export function parseParams<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  params: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(params);

  if (!result.success) {
    throw ApiException.invalidParam(toErrorDetails(result.error.issues));
  }

  return result.data;
}

export function parseQuery<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  query: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(query);

  if (!result.success) {
    throw ApiException.invalidQuery(toErrorDetails(result.error.issues));
  }

  return result.data;
}
