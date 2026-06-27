import { z } from 'zod';

import { booleanQuerySchema, yyyymmSchema } from '../../shared/schema-helpers';

const allowedRadiusMeters = [500, 1000, 2000, 3000] as const;

export const nearbyTradesQuerySchema = z
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
    lat: z.coerce
      .number()
      .min(-90, 'lat는 -90 이상이어야 합니다.')
      .max(90, 'lat는 90 이하여야 합니다.'),
    limit: z.coerce
      .number()
      .int()
      .min(1, 'limit은 1 이상이어야 합니다.')
      .max(500, 'limit은 500 이하여야 합니다.')
      .default(300),
    lng: z.coerce
      .number()
      .min(-180, 'lng는 -180 이상이어야 합니다.')
      .max(180, 'lng는 180 이하여야 합니다.'),
    radiusMeters: z.coerce
      .number()
      .refine(
        (value): value is (typeof allowedRadiusMeters)[number] =>
          allowedRadiusMeters.includes(value as (typeof allowedRadiusMeters)[number]),
        'radiusMeters는 500, 1000, 2000, 3000 중 하나여야 합니다.',
      ),
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

export type NearbyTradesQuery = z.infer<typeof nearbyTradesQuerySchema>;
