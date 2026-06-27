import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { AppConfigService } from '@app/config';
import { ApiException } from './api-error';
import type { RequestWithContext } from './request-context.types';

function resolveRequestOrigin(request: RequestWithContext): string | null {
  const origin = request.header('origin')?.trim();

  if (origin) {
    return origin;
  }

  const referer = request.header('referer')?.trim();

  if (!referer) {
    return null;
  }

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly configService: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const resolvedOrigin = resolveRequestOrigin(request);

    if (!resolvedOrigin) {
      if (this.configService.nodeEnv === 'production') {
        throw ApiException.forbiddenOrigin([
          {
            reason: 'Origin 또는 Referer 헤더가 필요합니다.',
          },
        ]);
      }

      return true;
    }

    if (this.configService.allowedOrigins.includes(resolvedOrigin)) {
      return true;
    }

    throw ApiException.forbiddenOrigin([
      {
        field: 'origin',
        reason: `${resolvedOrigin} 는 허용된 Origin 목록에 없습니다.`,
      },
    ]);
  }
}
