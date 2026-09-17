import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  readonly service: 'api';
  readonly status: 'ok';
}

@Injectable()
export class HealthService {
  getHealth(): HealthStatus {
    return { service: 'api', status: 'ok' };
  }
}
