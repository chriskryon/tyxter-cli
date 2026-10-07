import { describe, expect, it } from 'vitest';

import { signWebhook, verifyWebhookSignature } from './signature.js';

describe('webhook signatures', () => {
  it('rejects a same-length non-ASCII signature without throwing', () => {
    const secret = 'whsec_test';
    const timestamp = '1700000000';
    const rawBody = '{"id":"evt_test"}';
    const expected = signWebhook(secret, timestamp, rawBody);
    const signature = 'é'.repeat(expected.length);
    const verify = () =>
      verifyWebhookSignature({
        secret,
        timestamp,
        rawBody,
        signature,
        now: () => 1700000000000,
      });

    expect(verify).not.toThrow();
    expect(verify()).toBe(false);
  });
});
