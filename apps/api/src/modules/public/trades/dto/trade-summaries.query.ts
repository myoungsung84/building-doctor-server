import { z } from 'zod';

import { booleanQuerySchema, yyyymmSchema } from '../../shared/schema-helpers';

const tradeSummaryLevels = ['district', 'dong'] as const;

export const tradeSummariesQuerySchema = z
  .object({
    buildingUse: z
      .preprocess(
        (value) => (typeof value === 'string' ? value.trim() : undefined),
        z.string().min(1).max(50),
      )
      .optional(),
    excludeShareDeals: booleanQuerySchema.default(false),
    from: yyyymmSchema.optional(),
    includeCanceled: booleanQuerySchema.default(false),
    level: z.enum(tradeSummaryLevels),
    sggCd: z
      .string()
      .regex(/^\d{5}$/, 'sggCd는 5자리 숫자여야 합니다.')
      .optional(),
    sidoCd: z
      .string()
      .regex(/^\d{2}$/, 'sidoCd는 2자리 숫자여야 합니다.')
      .optional(),
    sidoNm: z
      .string()
      .transform((value) => value.trim())
      .pipe(z.string().min(1).max(20))
      .optional(),
    to: yyyymmSchema.optional(),
  })
  .superRefine((value, context) => {
    if ((value.from && !value.to) || (!value.from && value.to)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'from과 to는 함께 입력해야 합니다.',
        path: ['from'],
      });
      return;
    }

    if (value.level === 'dong' && !value.sggCd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'level=dong 조회에는 sggCd가 필요합니다.',
        path: ['sggCd'],
      });
    }

    if (!value.from || !value.to) {
      return;
    }

    if (value.from > value.to) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'from은 to보다 클 수 없습니다.',
        path: ['from'],
      });
    }

    const fromYear = Number(value.from.slice(0, 4));
    const toYear = Number(value.to.slice(0, 4));

    if (toYear - fromYear > 5) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: '기간은 최대 5년까지만 조회할 수 있습니다.',
        path: ['from'],
      });
    }
  });

export type TradeSummariesQuery = z.infer<typeof tradeSummariesQuerySchema>;
export type TradeSummaryLevel = (typeof tradeSummaryLevels)[number];
