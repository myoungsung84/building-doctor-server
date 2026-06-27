import { randomUUID } from 'node:crypto';

import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { RequestWithContext } from './request-context.types';

function createRequestId(): string {
  return `req_${randomUUID().replaceAll('-', '')}`;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: RequestWithContext, response: Response, next: NextFunction): void {
    const headerValue = request.header('x-request-id');
    const normalizedHeaderValue =
      typeof headerValue === 'string' && headerValue.trim() !== '' ? headerValue.trim() : null;
    const requestId = normalizedHeaderValue ?? createRequestId();

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    next();
  }
}
