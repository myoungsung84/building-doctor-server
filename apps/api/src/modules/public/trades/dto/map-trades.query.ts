import { z } from 'zod';

import { booleanQuerySchema, yyyymmSchema } from '../../shared/schema-helpers';

const mapDisplayModes = [
  'city-summary',
  'district-summary',
  'dong-summary',
  'parcel-detail',
] as const;

export const mapTradesQuerySchema = z
  .object({
    displayMode: z.enum(mapDisplayModes),
    east: z.coerce
      .number()
      .min(-180, 'east는 -180 이상이어야 합니다.')
      .max(180, 'east는 180 이하여야 합니다.'),
    excludeShareDeal: booleanQuerySchema.optional(),
    excludeShareDeals: booleanQuerySchema.optional(),
    from: yyyymmSchema.optional(),
    includeCanceled: booleanQuerySchema.default(false),
    limit: z.coerce.number().int().optional(),
    north: z.coerce
      .number()
      .min(-90, 'north는 -90 이상이어야 합니다.')
      .max(90, 'north는 90 이하여야 합니다.'),
    south: z.coerce
      .number()
      .min(-90, 'south는 -90 이상이어야 합니다.')
      .max(90, 'south는 90 이하여야 합니다.'),
    to: yyyymmSchema.optional(),
    west: z.coerce
      .number()
      .min(-180, 'west는 -180 이상이어야 합니다.')
      .max(180, 'west는 180 이하여야 합니다.'),
    zoom: z.coerce.number().optional(),
  })
  .superRefine((value, context) => {
    if (value.north <= value.south) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'north는 south보다 커야 합니다.',
        path: ['north'],
      });
    }

    if (value.east <= value.west) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'east는 west보다 커야 합니다.',
        path: ['east'],
      });
    }

    if ((value.from && !value.to) || (!value.from && value.to)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'from과 to는 함께 입력해야 합니다.',
        path: ['from'],
      });
    }

    if (value.from && value.to && value.from > value.to) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'from은 to보다 클 수 없습니다.',
        path: ['from'],
      });
    }

    if (value.from && value.to) {
      const fromYear = Number(value.from.slice(0, 4));
      const toYear = Number(value.to.slice(0, 4));

      if (toYear - fromYear > 5) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: '기간은 최대 5년까지만 조회할 수 있습니다.',
          path: ['from'],
        });
      }
    }

    if (value.displayMode === 'city-summary') {
      return;
    }

    const latSpan = value.north - value.south;
    const lngSpan = value.east - value.west;

    if (latSpan > 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'lat 범위는 최대 2도까지만 조회할 수 있습니다.',
        path: ['north'],
      });
    }

    if (lngSpan > 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'lng 범위는 최대 2도까지만 조회할 수 있습니다.',
        path: ['east'],
      });
    }
  })
  .transform(({ excludeShareDeal, excludeShareDeals, ...rest }) => ({
    ...rest,
    excludeShareDeal: excludeShareDeal ?? excludeShareDeals ?? false,
  }));

export type MapTradesQuery = z.infer<typeof mapTradesQuerySchema>;
export type MapDisplayMode = (typeof mapDisplayModes)[number];
