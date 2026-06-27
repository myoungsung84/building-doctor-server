import { z } from 'zod';

export const geocodeQuerySchema = z.object({
  q: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(2, 'q는 최소 2자 이상이어야 합니다.')
        .max(100, 'q는 최대 100자까지 입력할 수 있습니다.'),
    ),
});

export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>;
