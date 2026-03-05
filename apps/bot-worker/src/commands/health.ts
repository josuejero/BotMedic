import { InteractionResponseType, InteractionResponse, EnvBindings } from '../types/discord';

export function buildHealthResponse(env: EnvBindings): InteractionResponse {
  const version = env.BOT_VERSION ?? '0.1.0';
  const environment = env.BOT_ENV ?? 'development';
  const timestamp = new Date().toISOString();
  const content = `✅ BotMedic v${version} · environment: ${environment} · timestamp: ${timestamp}`;

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content,
      flags: 64
    }
  };
}
