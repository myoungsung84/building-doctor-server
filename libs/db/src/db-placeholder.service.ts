import { Injectable } from '@nestjs/common';

@Injectable()
export class DbPlaceholderService {
  readonly status = 'not-configured';

  describe(): string {
    return 'Database integration will be added in a later step.';
  }
}
