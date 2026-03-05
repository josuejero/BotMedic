import { InteractionResponse, InteractionResponseType } from '../types/discord';

const LATENCY_WARNING_THRESHOLD_MS = 400;

function parseDiscordTimestamp(timestamp?: string | null): number | undefined {
  if (!timestamp) {
    return undefined;
  }

  const trimmed = timestamp.trim();
  const asNumber = Number(trimmed);

  if (!Number.isNaN(asNumber)) {
    return trimmed.length === 10 ? asNumber * 1000 : asNumber;
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  return undefined;
}

export function buildLatencyResponse(headerTimestamp?: string | null, now = Date.now()): InteractionResponse {
  const timestampMs = parseDiscordTimestamp(headerTimestamp);
  if (!timestampMs) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content:
          'Latency check needs the Discord timestamp header, but it was missing or unparsable. Retry the command in a guild channel.',
      }
    };
  }

  const latencyMs = Math.max(0, now - timestampMs);
  const status = latencyMs < LATENCY_WARNING_THRESHOLD_MS ? 'healthy' : 'warning';
  const content = `Latency is ${latencyMs}ms (${status}; healthy < ${LATENCY_WARNING_THRESHOLD_MS}ms).`;

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content
    }
  };
}
