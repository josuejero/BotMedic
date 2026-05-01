import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { RULE_CASES, getRuleCase } from '@botmedic/rules';

describe('property-based rule safety checks', () => {
  it('rule custom IDs are stable, prefixed, and unique', () => {
    const customIds = RULE_CASES.map((rule) => rule.customId);

    expect(new Set(customIds).size).toBe(customIds.length);

    for (const rule of RULE_CASES) {
      expect(rule.customId).toBe(`helpme_symptom_${rule.id}`);
      expect(rule.customId).toMatch(/^helpme_symptom_[a-z0-9_]+$/);
    }
  });

  it('random custom IDs either resolve to the matching rule or fail closed', () => {
    const known = new Map(RULE_CASES.map((rule) => [rule.customId, rule]));

    fc.assert(
      fc.property(fc.string(), (value) => {
        const resolved = getRuleCase(value);

        if (known.has(value)) {
          expect(resolved).toBe(known.get(value));
        } else {
          expect(resolved).toBeUndefined();
        }
      })
    );
  });

  it('confidence scores stay inside the expected percentage range', () => {
    for (const rule of RULE_CASES) {
      expect(rule.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(rule.confidenceScore).toBeLessThanOrEqual(100);
    }
  });
});
