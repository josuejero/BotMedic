import { InteractionResponse, InteractionResponseType } from '../types/discord';
import { RULE_CASES, SymptomId, getRuleCaseById, RuleCase } from '@botmedic/rules';
import { buildHelpmeSymptomResponse } from './helpme';

const LIST_TITLE = 'Available incident scenarios:';

function buildScenarioListResponse(): InteractionResponse {
  const lines = [LIST_TITLE, ''];
  for (const rule of RULE_CASES) {
    lines.push(`• ${rule.id} — ${rule.buttonLabel}`);
  }
  lines.push('', 'Use `/incident <scenario>` to replay a specific case.');

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: lines.join('\n'),
      flags: 64
    }
  };
}

export function buildDeferredResponse(rule: RuleCase): InteractionResponse {
  return {
    type: InteractionResponseType.DeferredChannelMessageWithSource
  };
}

export function buildIncidentResponse(scenarioId?: SymptomId): InteractionResponse {
  if (!scenarioId) {
    return buildScenarioListResponse();
  }

  const rule = getRuleCaseById(scenarioId);
  if (!rule) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: `Unrecognized scenario "${scenarioId}". ${LIST_TITLE}`,
        flags: 64
      }
    };
  }

  if (rule.requiresDeferredResponse) {
    return buildDeferredResponse(rule);
  }

  return buildHelpmeSymptomResponse(rule.customId);
}
