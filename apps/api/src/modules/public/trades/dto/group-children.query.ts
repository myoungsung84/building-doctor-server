import { z } from 'zod';

import { booleanQuerySchema, yyyymmSchema } from '../../shared/schema-helpers';

const groupParentTypes = ['city', 'district', 'dong'] as const;
const groupChildTypes = ['district', 'dong', 'parcel'] as const;
const commonGroupChildrenSorts = [
  'tradeCount_desc',
  'parcelCount_desc',
  'avgDealAmount_desc',
  'medianDealAmount_desc',
  'avgPricePerPyeong_desc',
  'medianPricePerPyeong_desc',
  'latestDealDate_desc',
] as const;
const parcelOnlySorts = ['latestDealAmount_desc'] as const;
const groupChildrenSorts = [...commonGroupChildrenSorts, ...parcelOnlySorts] as const;

export type GroupParentType = (typeof groupParentTypes)[number];
export type GroupChildType = (typeof groupChildTypes)[number];
export type CommonGroupChildrenSort = (typeof commonGroupChildrenSorts)[number];
export type ParcelGroupChildrenSort = (typeof groupChildrenSorts)[number];
export type GroupChildrenSort = ParcelGroupChildrenSort;

const defaultSortByChildType: Record<GroupChildType, GroupChildrenSort> = {
  district: 'tradeCount_desc',
  dong: 'tradeCount_desc',
  parcel: 'latestDealDate_desc',
};

const groupChildrenSortSchema = z.enum(groupChildrenSorts);

export const groupChildrenQuerySchema = z
  .object({
    childType: z.enum(groupChildTypes),
    excludeShareDeal: booleanQuerySchema.optional(),
    excludeShareDeals: booleanQuerySchema.optional(),
    from: yyyymmSchema.optional(),
    includeCanceled: booleanQuerySchema.default(false),
    page: z.coerce.number().int().min(1, 'page는 1 이상이어야 합니다.').default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1, 'pageSize는 1 이상이어야 합니다.')
      .max(100, 'pageSize는 100 이하여야 합니다.')
      .default(20),
    parentType: z.enum(groupParentTypes),
    sggCd: z
      .string()
      .regex(/^\d{5}$/, 'sggCd는 5자리 숫자여야 합니다.')
      .optional(),
    sidoCd: z
      .string()
      .regex(/^\d{2}$/, 'sidoCd는 2자리 숫자여야 합니다.')
      .optional(),
    sort: groupChildrenSortSchema.optional(),
    to: yyyymmSchema.optional(),
    umdNm: z
      .string()
      .transform((value) => value.trim())
      .pipe(z.string().min(1, 'umdNm은 비어 있을 수 없습니다.').max(50))
      .optional(),
  })
  .superRefine((value, context) => {
    if ((value.from && !value.to) || (!value.from && value.to)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'from과 to는 함께 입력해야 합니다.',
        path: ['from'],
      });
    }

    if (value.from && value.to) {
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
    }

    const isValidCombination =
      (value.parentType === 'city' && value.childType === 'district') ||
      (value.parentType === 'district' && value.childType === 'dong') ||
      (value.parentType === 'dong' && value.childType === 'parcel');

    if (!isValidCombination) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: '허용되지 않는 parentType/childType 조합입니다.',
        path: ['childType'],
      });
    }

    if (value.parentType === 'city' && !value.sidoCd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'parentType=city 조회에는 sidoCd가 필요합니다.',
        path: ['sidoCd'],
      });
    }

    if (value.parentType === 'district' && !value.sggCd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'parentType=district 조회에는 sggCd가 필요합니다.',
        path: ['sggCd'],
      });
    }

    if (value.parentType === 'dong') {
      if (!value.sggCd) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'parentType=dong 조회에는 sggCd가 필요합니다.',
          path: ['sggCd'],
        });
      }

      if (!value.umdNm) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'parentType=dong 조회에는 umdNm이 필요합니다.',
          path: ['umdNm'],
        });
      }
    }

    if (
      value.sort === 'latestDealAmount_desc' &&
      value.childType !== 'parcel'
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'latestDealAmount_desc 정렬은 parcel 조회에서만 사용할 수 있습니다.',
        path: ['sort'],
      });
    }
  })
  .transform(({ childType, excludeShareDeal, excludeShareDeals, sort, ...rest }) => ({
    ...rest,
    childType,
    excludeShareDeal: excludeShareDeal ?? excludeShareDeals ?? false,
    sort: sort ?? defaultSortByChildType[childType],
  }));

export type GroupChildrenQuery = z.infer<typeof groupChildrenQuerySchema>;
