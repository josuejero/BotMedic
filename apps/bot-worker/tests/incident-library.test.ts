import { describe, it, expect } from 'vitest';
import symptoms from '../../fixtures/incidents/symptoms.json' assert { type: 'json' };
import diagnosisSnapshots from '../../fixtures/incidents/diagnosis-snapshots.json' assert { type: 'json' };
import customerSafe from '../../fixtures/incidents/customer-safe.json' assert { type: 'json' };
import { RULE_CASES, buildSupportResponseSections } from '@botmedic/rules';

describe('incident fixture library', () => {
  it('mirrors the worker rule cases', () => {
    expect(symptoms).toHaveLength(RULE_CASES.length);

    for (const rule of RULE_CASES) {
      const symptomEntry = symptoms.find((entry) => entry.id === rule.id);
      expect(symptomEntry).toBeDefined();
      expect(symptomEntry?.label).toBe(rule.buttonLabel);
      expect(symptomEntry?.symptom).toBe(rule.symptom);
      expect(symptomEntry?.evidence).toEqual(rule.evidence);

      const snapshot = diagnosisSnapshots[rule.id];
      expect(snapshot).toBeDefined();
      const sections = buildSupportResponseSections(rule);
      expect(snapshot?.internal).toEqual(sections.internal);
      expect(snapshot?.customer).toEqual(sections.customer);

      const customerEntry = customerSafe[rule.id];
      expect(customerEntry).toBeDefined();
      expect(customerEntry?.customerSafeExplanation).toBe(rule.customerSafeExplanation);
      expect(customerEntry?.safeNextStep).toBe(rule.safeNextStep);
    }
  });
});
