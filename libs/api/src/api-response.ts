export type ApiMeta = {
  count?: number;
  hasMore?: boolean;
  limit?: number;
  requestId: string;
  timestamp: string;
};

export type ApiErrorDetail = {
  field?: string;
  reason: string;
};

export type ApiErrorBody = {
  code: string;
  details?: ApiErrorDetail[];
  message: string;
};

export type ApiSuccess<T> = {
  meta: ApiMeta;
  result: T;
  status: 'success';
};

export type ApiFailure = {
  error: ApiErrorBody;
  meta: ApiMeta;
  status: 'error';
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function createApiMeta(input: {
  count?: number;
  hasMore?: boolean;
  limit?: number;
  requestId: string;
}): ApiMeta {
  return {
    requestId: input.requestId,
    timestamp: new Date().toISOString(),
    ...(input.count !== undefined ? { count: input.count } : {}),
    ...(input.limit !== undefined ? { limit: input.limit } : {}),
    ...(input.hasMore !== undefined ? { hasMore: input.hasMore } : {}),
  };
}

export function apiSuccess<T>(result: T, meta: ApiMeta): ApiSuccess<T> {
  return {
    status: 'success',
    result,
    meta,
  };
}

export function apiListSuccess<T>(result: T, meta: ApiMeta): ApiSuccess<T> {
  return {
    status: 'success',
    result,
    meta,
  };
}

export function apiError(error: ApiErrorBody, meta: ApiMeta): ApiFailure {
  return {
    status: 'error',
    error,
    meta,
  };
}
