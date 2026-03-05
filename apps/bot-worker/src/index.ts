import { verifyDiscordRequest } from './utils/discord';
import { buildHealthResponse } from './commands/health';
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

  if (interaction.type === InteractionType.ApplicationCommand) {
    const command = interaction.data?.name?.toLowerCase();
    if (command === 'health') {
      return jsonResponse(buildHealthResponse(env));
    }
    return new Response('Command not implemented', { status: 400 });
  }

  return new Response('Unsupported interaction type', { status: 400 });
}

export default {
  async fetch(request: Request, env: EnvBindings) {
    return handleDiscordRequest(request, env);
  }
};
