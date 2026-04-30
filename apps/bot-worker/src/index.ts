import { verifyDiscordRequest } from './utils/discord';
import { buildEnvCheckResponse } from './commands/envcheck';
import { buildHealthResponse } from './commands/health';
import { buildHelpmeResponse, buildHelpmeSymptomResponse } from './commands/helpme';
import { buildIncidentResponse } from './commands/incident';
import { buildLatencyResponse } from './commands/latency';
import { buildPermissionsResponse } from './commands/permissions';
import { handleDashboardRequest } from './dashboard';
import { recordCommandUsage, recordHealthSuccess, recordDiagnosis, recordInteractionMetric } from './telemetry';
import { getRuleCase, SymptomId } from '@botmedic/rules';
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

type ExecutionContextLike = {
  waitUntil(promise: Promise<unknown>): void;
};

function getResponseType(body: unknown): number | undefined {
  if (!body || typeof body !== 'object' || !('type' in body)) {
    return undefined;
  }
  const responseType = (body as { type?: unknown }).type;
  return typeof responseType === 'number' ? responseType : undefined;
}

export async function handleDiscordRequest(
  request: Request,
  env: EnvBindings,
  ctx?: ExecutionContextLike
): Promise<Response> {
  const startedAt = Date.now();
  const shouldRecordInteraction = request.method === 'POST';
  let commandName: string | undefined;
  let interactionType: number | undefined;
  let responseType: number | undefined;
  let finalStatus = 500;

  async function queueTelemetry(promise: Promise<unknown>): Promise<void> {
    const safeWrite = promise.catch(() => undefined);
    if (ctx) {
      ctx.waitUntil(safeWrite);
      return;
    }
    await safeWrite;
  }

  function tracked(response: Response, body?: unknown): Response {
    finalStatus = response.status;
    responseType = getResponseType(body);
    return response;
  }

  try {
    if (request.method === 'GET') {
      return tracked(await handleDashboardRequest(request, env));
    }

    if (request.method !== 'POST') {
      return tracked(new Response('Method Not Allowed', { status: 405 }));
    }

    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const bodyText = await request.text();

    if (!env.DISCORD_PUBLIC_KEY) {
      return tracked(new Response('Missing Discord public key', { status: 500 }));
    }

    const isValid = await verifyDiscordRequest(timestamp ?? '', bodyText, signature ?? '', env.DISCORD_PUBLIC_KEY);
    if (!isValid) {
      return tracked(new Response('Invalid request signature', { status: 401 }));
    }

    let interaction: Interaction;
    try {
      interaction = JSON.parse(bodyText) as Interaction;
      interactionType = interaction.type;
    } catch (error) {
      return tracked(new Response('Bad interaction payload', { status: 400 }));
    }

    if (interaction.type === InteractionType.Ping) {
      const body = { type: InteractionResponseType.Pong };
      return tracked(jsonResponse(body), body);
    }

    if (interaction.type === InteractionType.MessageComponent) {
      const rule = getRuleCase(interaction.data?.custom_id);
      await queueTelemetry(recordDiagnosis(env, rule));
      const body = buildHelpmeSymptomResponse(interaction.data?.custom_id);
      return tracked(jsonResponse(body), body);
    }

    if (interaction.type === InteractionType.ApplicationCommand) {
      const command = interaction.data?.name?.toLowerCase();
      const scenarioOption = interaction.data?.options?.find((option) => option.name === 'scenario')?.value;
      const scenarioId: SymptomId | undefined = typeof scenarioOption === 'string' ? (scenarioOption as SymptomId) : undefined;
      if (!command) {
        return tracked(new Response('Missing command name', { status: 400 }));
      }

      commandName = command;
      await queueTelemetry(recordCommandUsage(env, command));
      switch (command) {
        case 'health': {
          await queueTelemetry(recordHealthSuccess(env));
          const body = buildHealthResponse(env);
          return tracked(jsonResponse(body), body);
        }
        case 'envcheck': {
          const body = buildEnvCheckResponse(env);
          return tracked(jsonResponse(body), body);
        }
        case 'permissions': {
          const body = buildPermissionsResponse(interaction);
          return tracked(jsonResponse(body), body);
        }
        case 'latency': {
          const body = buildLatencyResponse(timestamp);
          return tracked(jsonResponse(body), body);
        }
        case 'helpme': {
          const body = buildHelpmeResponse();
          return tracked(jsonResponse(body), body);
        }
        case 'incident': {
          const body = buildIncidentResponse(scenarioId);
          return tracked(jsonResponse(body), body);
        }
        default:
          return tracked(new Response('Command not implemented', { status: 400 }));
      }
    }

    return tracked(new Response('Unsupported interaction type', { status: 400 }));
  } finally {
    if (shouldRecordInteraction) {
      await queueTelemetry(recordInteractionMetric(env, {
        commandName,
        status: finalStatus,
        latencyMs: Date.now() - startedAt,
        interactionType,
        responseType,
        timestamp: new Date().toISOString()
      }));
    }
  }
}

export default {
  async fetch(request: Request, env: EnvBindings, ctx: ExecutionContextLike) {
    return handleDiscordRequest(request, env, ctx);
  }
};
