import { z } from 'zod';

export const booleanQuerySchema = z.preprocess(
  (value) => {
    if (value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      if (value === 'true') {
        return true;
      }

      if (value === 'false') {
        return false;
      }
    }

    return value;
  },
  z.boolean({ message: 'true 또는 false 값을 사용해 주세요.' }),
);

export const yyyymmSchema = z
  .string()
  .regex(/^\d{6}$/, 'YYYYMM 형식을 사용해 주세요.')
  .refine((value) => {
    const month = Number(value.slice(4, 6));

    return month >= 1 && month <= 12;
  }, '유효한 YYYYMM 값을 사용해 주세요.');
