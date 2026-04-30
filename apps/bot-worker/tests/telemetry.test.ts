import { describe, expect, it } from 'vitest';
import * as ed25519 from '@noble/ed25519';
import { handleDiscordRequest } from '../src/index';
import {
  recordInteractionMetric,
  readInteractionRollup
} from '../src/telemetry';
import {
  EnvBindings,
  InteractionResponseType,
  InteractionType
} from '../src/types/discord';

const encoder = new TextEncoder();

class MockKv {
  private readonly values = new Map<string, string>();

  async get(key: string, options?: { type?: string }): Promise<unknown> {
    const value = this.values.get(key) ?? null;
    if (value === null) return null;
    if (options?.type === 'json') return JSON.parse(value);
    return value;
  }

  async put(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function asKv(kv: MockKv): KVNamespace {
  return kv as unknown as KVNamespace;
}

async function createSignedRequest(
  bodyText: string,
  privateKey: Uint8Array,
  timestamp = `${Date.now()}`
): Promise<Request> {
  const signature = await ed25519.sign(encoder.encode(timestamp + bodyText), privateKey);
  return new Request('https://example.com/', {
    method: 'POST',
    headers: {
      'x-signature-ed25519': bytesToHex(signature),
      'x-signature-timestamp': timestamp,
      'content-type': 'application/json'
    },
    body: bodyText
  });
}

async function createSignedInteraction(
  payload: Record<string, unknown>,
  privateKey: Uint8Array
): Promise<Request> {
  return createSignedRequest(JSON.stringify(payload), privateKey);
}

describe('interaction telemetry', () => {
  it('skips interaction metric writes when DASHBOARD_KV is missing', async () => {
    const env: EnvBindings = {
      DISCORD_PUBLIC_KEY: 'a'.repeat(64)
    };

    await expect(recordInteractionMetric(env, {
      status: 200,
      latencyMs: 50,
      timestamp: '2026-04-30T00:00:00Z'
    })).resolves.toBeUndefined();

    await expect(readInteractionRollup(env)).resolves.toBeUndefined();
  });

  it('records a successful command status and command rollup', async () => {
    const kv = new MockKv();
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKey(privateKey);
    const request = await createSignedInteraction(
      {
        id: 'health-telemetry',
        type: InteractionType.ApplicationCommand,
        data: { name: 'health' },
        token: 'token',
        version: 1
      },
      privateKey
    );
    const env: EnvBindings = {
      DISCORD_PUBLIC_KEY: bytesToHex(publicKey),
      BOT_VERSION: '0.1.0',
      BOT_ENV: 'test',
      DASHBOARD_KV: asKv(kv)
    };

    const response = await handleDiscordRequest(request, env);
    const rollup = await readInteractionRollup(env);

    expect(response.status).toBe(200);
    expect(rollup?.total).toBe(1);
    expect(rollup?.success).toBe(1);
    expect(rollup?.error).toBe(0);
    expect(rollup?.byCommand.health).toBe(1);
    expect(rollup?.lastEvent?.status).toBeLessThan(500);
    expect(rollup?.lastEvent?.responseType).toBe(InteractionResponseType.ChannelMessageWithSource);
  });

  it('records malformed payloads with an error status', async () => {
    const kv = new MockKv();
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKey(privateKey);
    const request = await createSignedRequest('{', privateKey);
    const env: EnvBindings = {
      DISCORD_PUBLIC_KEY: bytesToHex(publicKey),
      DASHBOARD_KV: asKv(kv)
    };

    const response = await handleDiscordRequest(request, env);
    const rollup = await readInteractionRollup(env);

    expect(response.status).toBe(400);
    expect(rollup?.total).toBe(1);
    expect(rollup?.error).toBe(1);
    expect(rollup?.lastEvent?.status).toBe(400);
  });

  it('increments the under-three-second SLA counter', async () => {
    const kv = new MockKv();
    const env: EnvBindings = {
      DISCORD_PUBLIC_KEY: 'a'.repeat(64),
      DASHBOARD_KV: asKv(kv)
    };

    await recordInteractionMetric(env, {
      commandName: 'health',
      status: 200,
      latencyMs: 2999,
      timestamp: '2026-04-30T00:00:00Z'
    });
    await recordInteractionMetric(env, {
      commandName: 'health',
      status: 200,
      latencyMs: 3000,
      timestamp: '2026-04-30T00:00:01Z'
    });

    const rollup = await readInteractionRollup(env);
    expect(rollup?.total).toBe(2);
    expect(rollup?.underThreeSeconds).toBe(1);
  });

  it('caps recent latency samples at 100 entries', async () => {
    const kv = new MockKv();
    const env: EnvBindings = {
      DISCORD_PUBLIC_KEY: 'a'.repeat(64),
      DASHBOARD_KV: asKv(kv)
    };

    for (let index = 0; index < 105; index += 1) {
      await recordInteractionMetric(env, {
        commandName: 'latency',
        status: 200,
        latencyMs: index,
        timestamp: `2026-04-30T00:00:${String(index % 60).padStart(2, '0')}Z`
      });
    }

    const rollup = await readInteractionRollup(env);
    expect(rollup?.recentLatenciesMs).toHaveLength(100);
    expect(rollup?.recentLatenciesMs[0]).toBe(5);
    expect(rollup?.recentLatenciesMs[99]).toBe(104);
  });
});
