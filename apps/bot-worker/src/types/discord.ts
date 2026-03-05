export const InteractionType = {
  Ping: 1,
  ApplicationCommand: 2,
  MessageComponent: 3
} as const;

export const InteractionResponseType = {
  Pong: 1,
  ChannelMessageWithSource: 4
} as const;

export type InteractionTypeValue = (typeof InteractionType)[keyof typeof InteractionType];
export type InteractionResponseTypeValue = (typeof InteractionResponseType)[keyof typeof InteractionResponseType];

export interface InteractionData {
  name?: string;
  custom_id?: string;
}

export interface Interaction {
  id: string;
  type: InteractionTypeValue;
  data?: InteractionData;
  token: string;
  version: number;
  app_permissions?: string;
  member?: {
    permissions?: string;
  };
}

export interface InteractionResponse {
  type: InteractionResponseTypeValue;
  data?: {
    content?: string;
    flags?: number;
    embeds?: unknown[];
    components?: unknown[];
  };
}

export interface EnvBindings {
  DISCORD_PUBLIC_KEY: string;
  BOT_VERSION?: string;
  BOT_ENV?: string;
}
