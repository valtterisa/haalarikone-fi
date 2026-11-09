import { generateKeyPairSync, sign } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { verifyDiscordInteractionSignature } from '@/lib/discord-verify-interaction';

describe('verifyDiscordInteractionSignature', () => {
  it('accepts a valid ed25519 signature and rejects a bad one', () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const spki = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
    const publicKeyHex = spki.subarray(-32).toString('hex');

    const timestamp = '1234567890';
    const rawBody = '{"type":1}';
    const signatureHex = sign(null, Buffer.from(timestamp + rawBody), privateKey).toString('hex');

    expect(
      verifyDiscordInteractionSignature({
        publicKeyHex,
        signatureHex,
        timestamp,
        rawBody,
      }),
    ).toBe(true);

    expect(
      verifyDiscordInteractionSignature({
        publicKeyHex,
        signatureHex: '00'.repeat(64),
        timestamp,
        rawBody,
      }),
    ).toBe(false);
  });
});
