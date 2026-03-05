import { describe, it, expect } from 'vitest';
import * as ed25519 from '@noble/ed25519';
import { buildEnvCheckResponse } from '../src/commands/envcheck';
import { buildHealthResponse } from '../src/commands/health';
import { buildLatencyResponse } from '../src/commands/latency';
import { buildPermissionsResponse } from '../src/commands/permissions';
import { buildHelpmeResponse, buildHelpmeSymptomResponse } from '../src/commands/helpme';
import { buildDeferredResponse } from '../src/commands/incident';
import { handleDiscordRequest } from '../src/index';
import { verifyDiscordRequest } from '../src/utils/discord';
import {
  InteractionType,
  InteractionResponseType,
  EnvBindings,
  Interaction
} from '../src/types/discord';
import { RULE_CASES } from '@botmedic/rules';

const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function createSignedInteraction(
  payload: Record<string, unknown>,
  privateKey: Uint8Array,
  timestamp?: string
): Promise<{ request: Request; timestamp: string }> {
  const body = JSON.stringify(payload);
  const ts = timestamp ?? `${Date.now()}`;
  const signature = await ed25519.sign(encoder.encode(ts + body), privateKey);

  const request = new Request('https://example.com/', {
    method: 'POST',
    headers: {
      'x-signature-ed25519': bytesToHex(signature),
      'x-signature-timestamp': ts,
      'content-type': 'application/json'
    },
    body
  });

  return { request, timestamp: ts };
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

  it('builds an envcheck response when environment variables are valid', () => {
    const env: EnvBindings = {
      DISCORD_PUBLIC_KEY: 'a'.repeat(64),
      BOT_VERSION: '1.2.3',
      BOT_ENV: 'production'
    };

    const response = buildEnvCheckResponse(env);
    expect(response.data?.content).toContain('Required variables look good');
    expect(response.data?.content).toContain('Bot version: 1.2.3');
    expect(response.data?.content).toContain('Environment: production');
  });

  it('reports malformed environment values when they fail validation', () => {
    const env: EnvBindings = {
      DISCORD_PUBLIC_KEY: 'deadbeef',
      BOT_VERSION: '',
      BOT_ENV: 'funky'
    };

    const response = buildEnvCheckResponse(env);
    expect(response.data?.content).toContain('Malformed');
    expect(response.data?.content).toContain('Discord public key');
    expect(response.data?.content).toContain('Bot environment');
  });

  it('builds a permissions response that lists missing flags', () => {
    const interaction: Interaction = {
      id: 'perm-1',
      type: InteractionType.ApplicationCommand,
      data: { name: 'permissions' },
      token: 'token',
      version: 1,
      app_permissions: ((1n << 10n) | (1n << 11n) | (1n << 31n)).toString()
    };

    const response = buildPermissionsResponse(interaction);
    expect(response.data?.content).toContain('Missing the following permissions');
    expect(response.data?.content).toContain('Embed links');
    expect(response.data?.content).toContain('Read message history');
  });

  it('builds a permissions response that confirms all flags are present', () => {
    const interaction: Interaction = {
      id: 'perm-2',
      type: InteractionType.ApplicationCommand,
      data: { name: 'permissions' },
      token: 'token',
      version: 1,
      app_permissions: (
        (1n << 10n) |
        (1n << 11n) |
        (1n << 14n) |
        (1n << 16n) |
        (1n << 31n)
      ).toString()
    };

    const response = buildPermissionsResponse(interaction);
    expect(response.data?.content).toContain('Bot has all the essential channel permissions');
  });

  it('builds a latency response using the Discord timestamp header', () => {
    const response = buildLatencyResponse('1000', 1400);
    expect(response.data?.content).toContain('Latency is 400ms');
    expect(response.data?.content).toContain('healthy');
  });

  it('builds a helpme response with interactive buttons', () => {
    const response = buildHelpmeResponse();
    expect(response.data?.flags).toBe(64);
    const rows = response.data?.components ?? [];
    const expectedRows = Math.ceil(RULE_CASES.length / 5);
    expect(rows).toHaveLength(expectedRows);
    const buttonCount = rows
      .flatMap((row) => ((row as { components?: unknown[] })?.components ?? []))
      .length;
    expect(buttonCount).toBe(RULE_CASES.length);
  });

  it('builds a helpme symptom response for known buttons', () => {
    const response = buildHelpmeSymptomResponse('helpme_symptom_invalid_token');
    expect(response.data?.content).toContain('You selected: Invalid/rotated bot token');
    expect(response.data?.content).toContain('Internal diagnosis:');
    expect(response.data?.content).toContain('Probable root cause:');
    expect(response.data?.content).toContain('Confidence level:');
    expect(response.data?.content).toContain('Technical next step:');
  });

  it('handles helpme button interactions', async () => {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKey(privateKey);
    const { request } = await createSignedInteraction(
      {
        id: 'component-1',
        type: InteractionType.MessageComponent,
        data: { custom_id: 'helpme_symptom_invalid_token' },
        token: 'token',
        version: 1
      },
      privateKey
    );

    const env: EnvBindings = {
      DISCORD_PUBLIC_KEY: bytesToHex(publicKey)
    };

    const response = await handleDiscordRequest(request, env);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data?.flags).toBe(64);
    expect(body.data?.content).toContain('Invalid/rotated bot token');
    expect(body.data?.content).toContain('Internal diagnosis:');
    expect(body.data?.content).toContain('Diagnosis: Discord rejects the bot token, so interactions never hit the worker despite Cloudflare being available.');
    expect(body.data?.content).toContain('Probable root cause:');
    expect(body.data?.content).toContain('Exact checks performed:');
    expect(body.data?.content).toContain('Customer-facing explanation:');
    expect(body.data?.content).toContain('What happened:');
    expect(body.data?.content).toContain('What to try next:');
    expect(body.data?.content).toContain('When to contact support again:');
  });

  it('lists incident scenarios when no option is provided', async () => {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKey(privateKey);
    const { request } = await createSignedInteraction(
      {
        id: 'incident-list',
        type: InteractionType.ApplicationCommand,
        data: { name: 'incident' },
        token: 'token',
        version: 1
      },
      privateKey
    );

    const env: EnvBindings = {
      DISCORD_PUBLIC_KEY: bytesToHex(publicKey)
    };

    const response = await handleDiscordRequest(request, env);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data?.content).toContain('Available incident scenarios:');
    expect(body.data?.content).toContain('invalid_token');
  });

  it('replays a scenario via the incident command', async () => {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKey(privateKey);
    const { request } = await createSignedInteraction(
      {
        id: 'incident-run',
        type: InteractionType.ApplicationCommand,
        data: { name: 'incident', options: [{ name: 'scenario', value: 'invalid_token' }] },
        token: 'token',
        version: 1
      },
      privateKey
    );

    const env: EnvBindings = {
      DISCORD_PUBLIC_KEY: bytesToHex(publicKey)
    };

    const response = await handleDiscordRequest(request, env);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data?.content).toContain('You selected: Invalid/rotated bot token');
    expect(body.data?.content).toContain('Internal diagnosis:');
  });

  it('returns a deferred response for the slow handler scenario', async () => {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKey(privateKey);
    const { request } = await createSignedInteraction(
      {
        id: 'incident-defer',
        type: InteractionType.ApplicationCommand,
        data: { name: 'incident', options: [{ name: 'scenario', value: 'slow_handler_deferred' }] },
        token: 'token',
        version: 1
      },
      privateKey
    );

    const env: EnvBindings = {
      DISCORD_PUBLIC_KEY: bytesToHex(publicKey)
    };

    const response = await handleDiscordRequest(request, env);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.type).toBe(InteractionResponseType.DeferredChannelMessageWithSource);
  });

  it('builds a deferred incident response helper', () => {
    const slowRule = RULE_CASES.find((rule) => rule.id === 'slow_handler_deferred');
    expect(slowRule).toBeDefined();
    const response = buildDeferredResponse(slowRule!);
    expect(response.type).toBe(InteractionResponseType.DeferredChannelMessageWithSource);
  });

  it('responds to PING interactions with type 1', async () => {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKey(privateKey);
    const { request } = await createSignedInteraction(
      {
        id: 'ping-1',
        token: 'token',
        version: 1,
        type: InteractionType.Ping
      },
      privateKey
    );

    const env: EnvBindings = {
      DISCORD_PUBLIC_KEY: bytesToHex(publicKey)
    };

    const response = await handleDiscordRequest(request, env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ type: 1 });
  });
});
