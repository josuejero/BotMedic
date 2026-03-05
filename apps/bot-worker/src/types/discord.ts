export const InteractionType = {
  Ping: 1,
  ApplicationCommand: 2
} as const;

export const InteractionResponseType = {
  Pong: 1,
  ChannelMessageWithSource: 4
} as const;

export type InteractionTypeValue = (typeof InteractionType)[keyof typeof InteractionType];
export type InteractionResponseTypeValue = (typeof InteractionResponseType)[keyof typeof InteractionResponseType];

export interface InteractionData {
  name?: string;
}

export interface Interaction {
  id: string;
  type: InteractionTypeValue;
  data?: InteractionData;
  token: string;
  version: number;
}

export interface InteractionResponse {
  type: InteractionResponseTypeValue;
  data?: {
    content?: string;
    flags?: number;
    embeds?: unknown[];
  };
}

export interface EnvBindings {
  DISCORD_PUBLIC_KEY: string;
  BOT_VERSION?: string;
  BOT_ENV?: string;
}
