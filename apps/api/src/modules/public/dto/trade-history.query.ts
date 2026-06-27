import { z } from 'zod';

import { booleanQuerySchema } from './schema-helpers';

export const tradeHistoryQuerySchema = z.object({
  excludeShareDeals: booleanQuerySchema.default(false),
  includeCanceled: booleanQuerySchema.default(false),
  jibun: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, 'jibun은 비어 있을 수 없습니다.')
        .max(30, 'jibun은 최대 30자까지 입력할 수 있습니다.')
        .refine((value) => !value.includes('*'), 'jibun에는 * 문자를 포함할 수 없습니다.'),
    ),
  sggCd: z.string().regex(/^\d{5}$/, 'sggCd는 5자리 숫자여야 합니다.'),
  umdNm: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, 'umdNm은 비어 있을 수 없습니다.')
        .max(50, 'umdNm은 최대 50자까지 입력할 수 있습니다.'),
    ),
});

export type TradeHistoryQuery = z.infer<typeof tradeHistoryQuerySchema>;
