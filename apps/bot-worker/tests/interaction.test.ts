import { describe, it, expect } from 'vitest';
import * as ed25519 from '@noble/ed25519';
import { buildHealthResponse } from '../src/commands/health';
import { handleDiscordRequest } from '../src/index';
import { verifyDiscordRequest } from '../src/utils/discord';
import { InteractionType, InteractionResponseType, EnvBindings } from '../src/types/discord';

const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

describe('Discord interaction helper', () => {
  it('verifies valid signatures and rejects invalid ones', async () => {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKey(privateKey);
    const timestamp = `${Date.now()}`;
    const payload = JSON.stringify({ type: InteractionType.Ping, id: '1', token: 'abc', version: 1 });
    const message = timestamp + payload;
    const signature = await ed25519.sign(encoder.encode(message), privateKey);

    const valid = await verifyDiscordRequest(
      timestamp,
      payload,
      bytesToHex(signature),
      bytesToHex(publicKey)
    );
    expect(valid).toBe(true);

    const invalid = await verifyDiscordRequest(timestamp, payload, '00', bytesToHex(publicKey));
    expect(invalid).toBe(false);
  });

  it('builds a health response with the correct structure', () => {
    const env: EnvBindings = {
      DISCORD_PUBLIC_KEY: 'deadbeef',
      BOT_VERSION: '0.5.0',
      BOT_ENV: 'dryrun'
    };

    const response = buildHealthResponse(env);
    expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource);
    expect(response.data?.flags).toBe(64);
    expect(response.data?.content).toContain('v0.5.0');
    expect(response.data?.content).toContain('dryrun');
  });

  it('responds to PING interactions with type 1', async () => {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKey(privateKey);
    const timestamp = `${Date.now()}`;
    const payload = JSON.stringify({
      id: 'ping-1',
      token: 'token',
      version: 1,
      type: InteractionType.Ping
    });
    const signature = await ed25519.sign(encoder.encode(timestamp + payload), privateKey);

    const request = new Request('https://example.com/', {
      method: 'POST',
      headers: {
        'x-signature-ed25519': bytesToHex(signature),
        'x-signature-timestamp': timestamp,
        'content-type': 'application/json'
      },
      body: payload
    });

    const env: EnvBindings = {
      DISCORD_PUBLIC_KEY: bytesToHex(publicKey)
    };

    const response = await handleDiscordRequest(request, env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ type: 1 });
  });
});
