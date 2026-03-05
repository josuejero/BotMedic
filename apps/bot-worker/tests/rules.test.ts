import { describe, it, expect } from 'vitest';
import { RULE_CASES, getRuleCase, getRuleCaseById } from '@botmedic/rules';

describe('rule catalog', () => {
  it('defines all seeded cases and metadata', () => {
    expect(RULE_CASES).toHaveLength(10);

    for (const rule of RULE_CASES) {
      expect(rule.symptom).toBeTruthy();
      expect(rule.evidence.length).toBeGreaterThan(0);
      expect(rule.diagnosis).toBeTruthy();
      expect(rule.likelyCause).toBeTruthy();
      expect(rule.firstChecks.length).toBeGreaterThan(0);
      expect(rule.safeNextStep).toBeTruthy();
      expect(rule.customerSafeExplanation).toBeTruthy();
      expect(rule.safeRecoverySteps.length).toBeGreaterThan(0);
      expect(rule.dontDoThisFirst).toBeTruthy();
      expect(rule.customId).toBe(`helpme_symptom_${rule.id}`);
      expect(rule.buttonLabel).toBeTruthy();
    }
  });

  it('maps custom IDs back to their rule', () => {
    for (const rule of RULE_CASES) {
      expect(getRuleCase(rule.customId)).toBe(rule);
    }

    for (const rule of RULE_CASES) {
      expect(getRuleCase(rule.customId)).toBe(rule);
      expect(getRuleCaseById(rule.id)).toBe(rule);
    }

    expect(getRuleCase('unknown')).toBeUndefined();
    const deferredRule = RULE_CASES.find((rule) => rule.requiresDeferredResponse);
    expect(deferredRule?.id).toBe('slow_handler_deferred');
  });
});
