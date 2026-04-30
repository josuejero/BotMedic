import { describe, it, expect } from 'vitest';
import { DashboardData, COMMAND_NAMES } from '../src/telemetry';
import { IncidentSample, renderDashboardHtml } from '../src/dashboard';

describe('dashboard renderer', () => {
  it('includes counts, health, diagnosis, and incident samples', () => {
    const commandCounts = COMMAND_NAMES.reduce(
      (acc, command) => ({ ...acc, [command]: 3 }),
      {} as Record<string, number>
    ) as DashboardData['commandCounts'];

    const data: DashboardData = {
      commandCounts,
      lastHealth: {
        timestamp: '2026-03-05T12:00:00Z',
        environment: 'staging'
      },
      lastDiagnosis: {
        timestamp: '2026-03-05T12:05:00Z',
        ruleId: 'token_config_issue',
        label: 'Token/config issues',
        safeNextStep: 'Validate the public key copy/paste.'
      },
      interactionRollup: {
        total: 10,
        success: 9,
        error: 1,
        underThreeSeconds: 8,
        latencyBuckets: {
          lt100: 2,
          lt250: 3,
          lt500: 2,
          lt1000: 1,
          lt3000: 0,
          gte3000: 2
        },
        recentLatenciesMs: [80, 120, 220, 450],
        byCommand: {
          health: 4,
          incident: 2
        },
        lastEvent: {
          commandName: 'health',
          status: 200,
          latencyMs: 120,
          interactionType: 2,
          responseType: 4,
          timestamp: '2026-03-05T12:06:00Z'
        }
      }
    };

    const incidents: IncidentSample[] = [
      {
        id: 'test-1',
        title: 'Synthetic incident',
        summary: 'Something broke and was documented.',
        timestamp: '2025-10-01T00:00:00Z',
        lesson: 'Document postmortems in the fixtures folder.'
      }
    ];

    const html = renderDashboardHtml(data, incidents);

    for (const command of COMMAND_NAMES) {
      expect(html).toContain(`<span>${command}</span>`);
    }
    expect(html).toContain('Last successful /health');
    expect(html).toContain('Token/config issues');
    expect(html).toContain('Validate the public key copy/paste.');
    expect(html).toContain('Interaction reliability');
    expect(html).toContain('Total interactions');
    expect(html).toContain('90%');
    expect(html).toContain('80%');
    expect(html).toContain('Synthetic incident');
    expect(html).toContain('Document postmortems in the fixtures folder.');
  });
});
