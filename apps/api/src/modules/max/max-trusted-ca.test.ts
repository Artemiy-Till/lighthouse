import { X509Certificate } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { MAX_TRUSTED_ROOT_CA } from './max-trusted-ca.js';

describe('MAX trusted CA', () => {
  it('matches the published Russian Trusted Root CA fingerprint', () => {
    const certificate = new X509Certificate(MAX_TRUSTED_ROOT_CA);

    expect(certificate.fingerprint256).toBe(
      'D2:6D:2D:02:31:B7:C3:9F:92:CC:73:85:12:BA:54:10:35:19:E4:40:5D:68:B5:BD:70:3E:97:88:CA:8E:CF:31',
    );
    expect(certificate.subject).toContain('CN=Russian Trusted Root CA');
  });
});
