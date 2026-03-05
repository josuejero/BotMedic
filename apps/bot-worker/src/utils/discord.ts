import * as ed25519 from '@noble/ed25519';

const encoder = new TextEncoder();

function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (cleaned.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Cloudflare Worker needs to validate the signature Discord sends with each interaction.
 * Discord attaches `X-Signature-Ed25519` and `X-Signature-Timestamp` headers so the worker
 * can verify the raw body payload was actually sent by Discord.
 */
export async function verifyDiscordRequest(
  timestamp: string,
  body: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  if (!timestamp || !signature || !publicKey) {
    return false;
  }

  const message = timestamp + body;
  const messageBytes = encoder.encode(message);
  const signatureBytes = hexToBytes(signature);
  const publicKeyBytes = hexToBytes(publicKey);

  if (signatureBytes.length !== 64 || publicKeyBytes.length !== 32) {
    return false;
  }

  try {
    return await ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
  } catch {
    return false;
  }
}
