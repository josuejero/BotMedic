import { InteractionResponse, InteractionResponseType } from '../types/discord';
import { RULE_CASES, getRuleCase, formatRuleForMessage } from '../rules';

const BUTTONS_PER_ROW = 5;

function buildSymptomRows() {
  const rows: { type: 1; components: unknown[] }[] = [];
  for (let i = 0; i < RULE_CASES.length; i += BUTTONS_PER_ROW) {
    const chunk = RULE_CASES.slice(i, i + BUTTONS_PER_ROW);
    rows.push({
      type: 1,
      components: chunk.map((rule) => ({
        type: 2,
        style: rule.buttonStyle,
        label: rule.buttonLabel,
        custom_id: rule.customId,
        emoji: { name: rule.buttonEmoji }
      }))
    });
  }
  return rows;
}

export function buildHelpmeResponse(): InteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content:
        'Thanks for asking for help. Select the symptom that best matches what you are seeing so we can focus the diagnostics.',
      flags: 64,
      components: buildSymptomRows()
    }
  };
}

export function buildHelpmeSymptomResponse(customId?: string): InteractionResponse {
  const rule = getRuleCase(customId);
  const lines: string[] = ['BotMedic symptom intake:'];

  if (rule) {
    lines.push(`• You selected: ${rule.buttonLabel}`);
    lines.push(...formatRuleForMessage(rule));
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
