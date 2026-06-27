import { HttpException, HttpStatus } from '@nestjs/common';

import type { ApiErrorBody, ApiErrorDetail } from './api-response';

export type ApiErrorCode =
  | 'FORBIDDEN_ORIGIN'
  | 'INVALID_PARAM'
  | 'INVALID_QUERY'
  | 'INTERNAL_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED';

const API_ERROR_STATUS_MAP: Record<ApiErrorCode, number> = {
  FORBIDDEN_ORIGIN: HttpStatus.FORBIDDEN,
  INVALID_PARAM: HttpStatus.BAD_REQUEST,
  INVALID_QUERY: HttpStatus.BAD_REQUEST,
  INTERNAL_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  RATE_LIMITED: HttpStatus.TOO_MANY_REQUESTS,
};

export class ApiException extends HttpException {
  constructor(
    readonly apiErrorBody: ApiErrorBody,
    readonly apiErrorCode: ApiErrorCode,
    status = API_ERROR_STATUS_MAP[apiErrorCode],
  ) {
    super(apiErrorBody, status);
  }

  static forbiddenOrigin(details?: ApiErrorDetail[]): ApiException {
    return new ApiException(
      {
        code: 'FORBIDDEN_ORIGIN',
        details,
        message: '허용되지 않은 Origin 또는 Referer 입니다.',
      },
      'FORBIDDEN_ORIGIN',
    );
  }

  static internal(message = '서버 내부 오류가 발생했습니다.'): ApiException {
    return new ApiException(
      {
        code: 'INTERNAL_ERROR',
        message,
      },
      'INTERNAL_ERROR',
    );
  }

  static invalidParam(details?: ApiErrorDetail[]): ApiException {
    return new ApiException(
      {
        code: 'INVALID_PARAM',
        details,
        message: '요청 경로 파라미터를 확인해 주세요.',
      },
      'INVALID_PARAM',
    );
  }

  static invalidQuery(details?: ApiErrorDetail[]): ApiException {
    return new ApiException(
      {
        code: 'INVALID_QUERY',
        details,
        message: '요청 파라미터를 확인해 주세요.',
      },
      'INVALID_QUERY',
    );
  }

  static notFound(message: string, details?: ApiErrorDetail[]): ApiException {
    return new ApiException(
      {
        code: 'NOT_FOUND',
        details,
        message,
      },
      'NOT_FOUND',
    );
  }

  static rateLimited(message = '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'): ApiException {
    return new ApiException(
      {
        code: 'RATE_LIMITED',
        message,
      },
      'RATE_LIMITED',
    );
  }
}

export function mapHttpStatusToApiErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'INVALID_QUERY';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN_ORIGIN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'RATE_LIMITED';
    default:
      return 'INTERNAL_ERROR';
  }
}
