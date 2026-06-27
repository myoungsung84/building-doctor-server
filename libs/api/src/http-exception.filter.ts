import { randomUUID } from 'node:crypto';

import { Catch, type ArgumentsHost, type ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';

import { ApiException, mapHttpStatusToApiErrorCode } from './api-error';
import { apiError, createApiMeta } from './api-response';
import type { RequestWithContext } from './request-context.types';

function resolveRequestId(request: RequestWithContext): string {
  return request.requestId ?? request.header('x-request-id')?.trim() ?? `req_${randomUUID()}`;
}

function resolveHttpExceptionMessage(exception: HttpException): string {
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  if (response && typeof response === 'object') {
    const message = (response as { message?: string | string[] }).message;

    if (Array.isArray(message) && message.length > 0) {
      return message.join(', ');
    }

    if (typeof message === 'string' && message.trim() !== '') {
      return message;
    }
  }

  return exception.message;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithContext>();
    const response = context.getResponse<Response>();
    const requestId = resolveRequestId(request);
    const meta = createApiMeta({ requestId });

    if (exception instanceof ApiException) {
      response.status(exception.getStatus()).json(apiError(exception.apiErrorBody, meta));
      return;
    }

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(
        apiError(
          {
            code: mapHttpStatusToApiErrorCode(exception.getStatus()),
            message: resolveHttpExceptionMessage(exception),
          },
          meta,
        ),
      );
      return;
    }

    response.status(500).json(
      apiError(
        {
          code: 'INTERNAL_ERROR',
          message: '서버 내부 오류가 발생했습니다.',
        },
        meta,
      ),
    );
  }
}
