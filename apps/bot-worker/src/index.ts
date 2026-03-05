import { verifyDiscordRequest } from './utils/discord';
import { buildEnvCheckResponse } from './commands/envcheck';
import { buildHealthResponse } from './commands/health';
import { buildHelpmeResponse, buildHelpmeSymptomResponse } from './commands/helpme';
import { buildLatencyResponse } from './commands/latency';
import { buildPermissionsResponse } from './commands/permissions';
import { handleDashboardRequest } from './dashboard';
import { recordCommandUsage, recordHealthSuccess, recordDiagnosis } from './telemetry';
import { getRuleCase } from './rules';
import {
  InteractionType,
  InteractionResponseType,
  Interaction,
  EnvBindings
} from './types/discord';

const JSON_HEADERS = { 'content-type': 'application/json' };

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { headers: JSON_HEADERS });
}

export async function handleDiscordRequest(request: Request, env: EnvBindings): Promise<Response> {
  if (request.method === 'GET') {
    return handleDashboardRequest(request, env);
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const bodyText = await request.text();

  if (!env.DISCORD_PUBLIC_KEY) {
    return new Response('Missing Discord public key', { status: 500 });
  }

  const isValid = await verifyDiscordRequest(timestamp ?? '', bodyText, signature ?? '', env.DISCORD_PUBLIC_KEY);
  if (!isValid) {
    return new Response('Invalid request signature', { status: 401 });
  }

  let interaction: Interaction;
  try {
    interaction = JSON.parse(bodyText) as Interaction;
  } catch (error) {
    return new Response('Bad interaction payload', { status: 400 });
  }

  if (interaction.type === InteractionType.Ping) {
    return jsonResponse({ type: InteractionResponseType.Pong });
  }

  if (interaction.type === InteractionType.MessageComponent) {
    const rule = getRuleCase(interaction.data?.custom_id);
    await recordDiagnosis(env, rule);
    return jsonResponse(buildHelpmeSymptomResponse(interaction.data?.custom_id));
  }

  if (interaction.type === InteractionType.ApplicationCommand) {
    const command = interaction.data?.name?.toLowerCase();
    if (!command) {
      return new Response('Missing command name', { status: 400 });
    }

    await recordCommandUsage(env, command);
    switch (command) {
      case 'health':
        await recordHealthSuccess(env);
        return jsonResponse(buildHealthResponse(env));
      case 'envcheck':
        return jsonResponse(buildEnvCheckResponse(env));
      case 'permissions':
        return jsonResponse(buildPermissionsResponse(interaction));
      case 'latency':
        return jsonResponse(buildLatencyResponse(timestamp));
      case 'helpme':
        return jsonResponse(buildHelpmeResponse());
      default:
        return new Response('Command not implemented', { status: 400 });
    }
  }

  return new Response('Unsupported interaction type', { status: 400 });
}

export default {
  async fetch(request: Request, env: EnvBindings) {
    return handleDiscordRequest(request, env);
  }
};
