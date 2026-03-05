import { InteractionResponse, InteractionResponseType } from '../types/discord';

const SYMPTOM_BUTTONS = [
  { label: 'Bot offline or missing', emoji: '⚠️', customId: 'helpme_symptom_offline', style: 4 },
  { label: 'Commands throwing errors', emoji: '🧪', customId: 'helpme_symptom_commands', style: 1 },
  { label: 'Slow/laggy replies', emoji: '⏱️', customId: 'helpme_symptom_latency', style: 2 }
];

const SYMPTOM_GUIDANCE: Record<string, { title: string; detail: string }> = {
  helpme_symptom_offline: {
    title: 'Bot offline or missing',
    detail:
      'Check that the worker is deployed and the application command exists. Ensure the bot has the "Use Application Commands" permission in the guild.'
  },
  helpme_symptom_commands: {
    title: 'Commands throwing errors',
    detail:
      'Review the worker logs for recent failures and confirm environment variables like Bot version and Discord public key are correctly configured.'
  },
  helpme_symptom_latency: {
    title: 'Slow/laggy replies',
    detail:
      'Investigate any network throttling or high worker latency. Try redeploying or restarting integrations that sit in front of BotMedic.'
  }
};

export function buildHelpmeResponse(): InteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content:
        'Thanks for asking for help. Select the symptom that best matches what you are seeing so we can focus the diagnostics.',
      flags: 64,
      components: [
        {
          type: 1,
          components: SYMPTOM_BUTTONS.map((button) => ({
            type: 2,
            style: button.style,
            label: button.label,
            custom_id: button.customId,
            emoji: { name: button.emoji }
          }))
        }
      ]
    }
  };
}

export function buildHelpmeSymptomResponse(customId?: string): InteractionResponse {
  const symptom = customId ? SYMPTOM_GUIDANCE[customId] : undefined;
  const lines: string[] = ['BotMedic symptom intake:'];

  if (symptom) {
    lines.push(`• You selected: ${symptom.title}`);
    lines.push(`• Next step: ${symptom.detail}`);
  } else {
    lines.push('• Thanks for the input! If nothing fits, keep sending new symptoms or open an issue.');
  }

  lines.push('• ℹ️ The diagnostics data stays ephemeral so only you can see it.');

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: lines.join('\n'),
      flags: 64
    }
  };
}
