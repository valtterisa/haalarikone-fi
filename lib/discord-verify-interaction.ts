import { createPublicKey, verify } from 'node:crypto';

/** Verify Discord Interactions Ed25519 signature (hex public key + hex signature). */
export function verifyDiscordInteractionSignature(params: {
  publicKeyHex: string;
  signatureHex: string;
  timestamp: string;
  rawBody: string;
}): boolean {
  try {
    const key = createPublicKey({
      key: Buffer.concat([
        Buffer.from('302a300506032b6570032100', 'hex'),
        Buffer.from(params.publicKeyHex, 'hex'),
      ]),
      format: 'der',
      type: 'spki',
    });

    return verify(
      null,
      Buffer.from(params.timestamp + params.rawBody),
      key,
      Buffer.from(params.signatureHex, 'hex'),
    );
  } catch {
    return false;
  }
}
