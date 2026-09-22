import { Injectable } from '@nestjs/common';
import { request } from 'node:https';
import { rootCertificates } from 'node:tls';

import { MAX_TRUSTED_ROOT_CA } from './max-trusted-ca.js';

export interface MaxTransportResponse {
  readonly body: string;
  readonly status: number;
}

export interface MaxTransportRequestOptions {
  readonly body?: string;
  readonly method?: 'GET' | 'POST';
}

@Injectable()
export class MaxApiTransport {
  request(
    url: URL,
    headers: Readonly<Record<string, string>>,
    timeout: number,
    options: MaxTransportRequestOptions = {},
  ): Promise<MaxTransportResponse> {
    return new Promise((resolve, reject) => {
      const outgoingRequest = request(
        url,
        {
          ca: [...rootCertificates, MAX_TRUSTED_ROOT_CA],
          headers,
          method: options.method ?? 'GET',
          timeout,
        },
        (response) => {
          response.setEncoding('utf8');
          let body = '';

          response.on('data', (chunk: string) => {
            body += chunk;
          });
          response.on('end', () => {
            resolve({ body, status: response.statusCode ?? 0 });
          });
          response.on('error', reject);
        },
      );

      outgoingRequest.on('timeout', () => {
        outgoingRequest.destroy(new Error('MAX API request timed out'));
      });
      outgoingRequest.on('error', reject);
      if (options.body) outgoingRequest.write(options.body);
      outgoingRequest.end();
    });
  }
}
