import { describe, expect, it } from 'vitest';
import { buildEnvCheckResponse } from '../src/commands/envcheck';
import { buildHealthResponse } from '../src/commands/health';
import { buildHelpmeResponse } from '../src/commands/helpme';

const DISCORD_INITIAL_RESPONSE_BUDGET_MS = 3000;

function measure(fn: () => unknown): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

describe('synthetic command response budget', () => {
  it('builds common command responses under Discord initial response budget', () => {
    const env = {
      DISCORD_PUBLIC_KEY: 'a'.repeat(64),
      BOT_VERSION: '0.1.0',
      BOT_ENV: 'test'
    };

    const durations = [
      measure(() => buildHealthResponse(env)),
      measure(() => buildEnvCheckResponse(env)),
      measure(() => buildHelpmeResponse())
    ];

    for (const duration of durations) {
      expect(duration).toBeLessThan(DISCORD_INITIAL_RESPONSE_BUDGET_MS);
    }
  });
});
