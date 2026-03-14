import { commands, ruleCases } from './data.js';

const safeRuleCases = Array.isArray(ruleCases) ? ruleCases : [];
const safeCommands = Array.isArray(commands) ? commands : [];
const runbookMap = new Map(safeRuleCases.map((rule) => [rule?.id, rule]));

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const humanizeId = (value = '') =>
  String(value)
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const truncate = (value, limit = 148) => {
  if (!isNonEmptyString(value)) return '';
  const trimmed = value.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit).trimEnd()}…`;
};

const firstString = (...values) => values.find(isNonEmptyString) ?? '';

const getRuleTitle = (rule = {}) =>
  firstString(rule.buttonLabel, rule.label, rule.title, rule.name, humanizeId(rule.id), 'Untitled runbook');

const getRuleConfidence = (rule = {}) => {
  if (typeof rule.confidenceScore === 'number' && Number.isFinite(rule.confidenceScore)) return rule.confidenceScore;
  if (typeof rule.confidence === 'number' && Number.isFinite(rule.confidence)) return rule.confidence;
  return null;
};

const getRuleTag = (rule = {}) => {
  const confidence = getRuleConfidence(rule);
  if (typeof confidence === 'number') return `Confidence ${confidence}%`;
  return firstString(rule.id && humanizeId(rule.id), 'Runbook');
};

const getRuleSymptom = (rule = {}) =>
  firstString(rule.symptom, rule.diagnosis, rule.customerSafeExplanation, rule.safeNextStep, 'Details coming soon.');

const getRuleEvidencePreview = (rule = {}) => {
  if (Array.isArray(rule.evidence) && rule.evidence.length) {
    return firstString(rule.evidence[0], rule.evidence[1]);
  }

  if (Array.isArray(rule.firstChecks) && rule.firstChecks.length) {
    return firstString(rule.firstChecks[0], rule.firstChecks[1]);
  }

  return firstString(rule.safeNextStep, 'See the full runbook for the first recovery step.');
};

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (!page) return;

  switch (page) {
    case 'home':
      renderHome();
      break;
    case 'runbook-list':
      renderRunbookLibrary();
      break;
    case 'runbook-detail':
      renderRunbookDetail();
      break;
    case 'diagnosis':
      renderDiagnosisPage();
      break;
    case 'quick-reference':
      renderQuickReference();
      break;
    default:
      break;
  }
});

function renderHome() {
  populateCards('[data-command-gallery]', safeCommands, createCommandCard);
  populateCards('[data-failure-gallery]', safeRuleCases, createFailureCard);
  populateCards('[data-runbook-teaser]', safeRuleCases, createRunbookTeaser);
  renderQuickReferenceSummary();
}

function renderRunbookLibrary() {
  populateCards('[data-runbook-list]', safeRuleCases, createRunbookCard);
}

function renderRunbookDetail() {
  const container = document.querySelector('[data-runbook-detail]');
  const runbookId = document.body.dataset.runbook;
  if (!container || !runbookId) return;

  const runbook = runbookMap.get(runbookId);
  if (!runbook) {
    container.innerHTML = '<p class="warning-banner">Runbook not found.</p>';
    return;
  }

  const nameEl = document.querySelector('[data-runbook-name]');
  const labelEl = document.querySelector('[data-runbook-label]');
  const symptomEl = document.querySelector('[data-runbook-symptom]');
  const confidenceEl = document.querySelector('[data-runbook-confidence]');

  if (nameEl) nameEl.textContent = getRuleTitle(runbook);
  if (labelEl) labelEl.textContent = firstString(runbook.id, 'Case identifier');
  if (symptomEl) symptomEl.textContent = getRuleSymptom(runbook);
  if (confidenceEl) confidenceEl.textContent = getRuleTag(runbook);

  const breakdown = Array.isArray(runbook.safeRecoverySteps)
    ? runbook.safeRecoverySteps.map((step) => `<li>${step}</li>`).join('')
    : '<li>Capture the current state, then follow the safest documented recovery path.</li>';

  const checks = Array.isArray(runbook.firstChecks)
    ? runbook.firstChecks.map((check) => `<li>${check}</li>`).join('')
    : '<li>Start with /envcheck and verify the endpoint is current.</li>';

  const evidence = Array.isArray(runbook.evidence)
    ? runbook.evidence.map((line) => `<li>${line}</li>`).join('')
    : `<li>${getRuleEvidencePreview(runbook)}</li>`;

  container.innerHTML = `
    <section class="runbook-columns">
      <article class="column">
        <h3>Polished explanation</h3>
        <p>${firstString(runbook.customerSafeExplanation, getRuleSymptom(runbook))}</p>
        <h4>Customer-safe response</h4>
        <p>${firstString(runbook.safeNextStep, 'Follow the safest next step in the operator checklist.')}</p>
        <h4>Safe recovery steps</h4>
        <ul>${breakdown}</ul>
      </article>
      <article class="column">
        <h3>Support logic</h3>
        <p><strong>Diagnosis:</strong> ${firstString(runbook.diagnosis, getRuleSymptom(runbook))}</p>
        <p><strong>Likely cause:</strong> ${firstString(runbook.likelyCause, 'Still under investigation.')}</p>
        <h4>Evidence &amp; checks</h4>
        <ul>${evidence}</ul>
        <p><strong>Escalation threshold:</strong> ${firstString(runbook.escalationThreshold, 'Escalate after the documented first checks fail.')}</p>
        <p class="warning-banner">Don’t do this first: ${firstString(runbook.dontDoThisFirst, 'Avoid broad changes before the first checks are complete.')}</p>
      </article>
    </section>
    <section>
      <h3>First checks</h3>
      <ul>${checks}</ul>
    </section>
  `;
}

function renderDiagnosisPage() {
  const timeline = document.querySelector('[data-diagnosis-timeline]');
  if (!timeline || !safeRuleCases.length) return;

  const sampleRule = safeRuleCases[0];
  const timelineTag = getRuleTag(sampleRule);

  timeline.innerHTML = `
    <ol>
      <li>Symptom intake: “${getRuleSymptom(sampleRule)}” triggered the flow.</li>
      <li>Rule scoring: evidence (${truncate(getRuleEvidencePreview(sampleRule), 180)}) led to ${timelineTag.toLowerCase()}.</li>
      <li>Support layers: publish internal diagnosis + customer messaging and write ephemeral traces for reproducibility.</li>
    </ol>
  `;

  const comparison = document.querySelector('[data-support-vs-human]');
  if (comparison) {
    comparison.innerHTML = `
      <article class="column">
        <h4>Support logic</h4>
        <p>Diagnosis: ${firstString(sampleRule.diagnosis, getRuleSymptom(sampleRule))}</p>
        <p>Likely cause: ${firstString(sampleRule.likelyCause, 'Still under investigation.')}</p>
        <p>First check: ${firstString(sampleRule.firstChecks?.[0], 'Start with /envcheck.')}</p>
      </article>
      <article class="column">
        <h4>Human story</h4>
        <p>${firstString(sampleRule.customerSafeExplanation, getRuleSymptom(sampleRule))}</p>
        <p>Customer gets: ${firstString(sampleRule.safeNextStep, 'Follow the safest next step in the runbook.')}</p>
      </article>
    `;
  }
}

function renderQuickReference() {
  const tableBody = document.querySelector('[data-reference-table-body]');
  if (!tableBody) return;

  tableBody.innerHTML = safeRuleCases
    .map(
      (rule) => `
        <tr>
          <td><strong>${getRuleTitle(rule)}</strong><br><small>${truncate(getRuleSymptom(rule), 120)}</small></td>
          <td><strong>${firstString(rule.firstChecks?.[0], 'Start with /envcheck')}</strong><br>${rule.firstChecks?.slice(1).join('<br>') ?? ''}</td>
          <td>${firstString(rule.safeNextStep, 'Open the runbook for the safest next step.')}</td>
          <td><a href="runbooks/${rule.id}.html">Open runbook</a></td>
        </tr>
      `
    )
    .join('');
}

function renderQuickReferenceSummary() {
  const container = document.querySelector('[data-reference-summary]');
  if (!container) return;

  const firstCheck = safeRuleCases[0]?.firstChecks?.[0] ?? 'Start with /envcheck';
  container.innerHTML = `
    <p>Priority checklist: <strong>${firstCheck}</strong></p>
    <p>Tip: Always run <code>/envcheck</code> before exploring the runbook library to ensure the environment bindings are healthy.</p>
  `;
}

function populateCards(selector, dataset, builder) {
  const container = document.querySelector(selector);
  if (!container) return;
  if (!Array.isArray(dataset) || !dataset.length) {
    container.innerHTML = '<article class="card"><p>Nothing to show yet.</p></article>';
    return;
  }
  container.innerHTML = dataset.map((item) => builder(item ?? {})).join('');
}

function createCommandCard(cmd = {}) {
  return `
    <article class="card card-command">
      <span class="pill">${firstString(cmd.icon, '•')}</span>
      <h3>/${firstString(cmd.name, 'command')}</h3>
      <p>${firstString(cmd.description, 'A BotMedic command description will appear here.')}</p>
    </article>
  `;
}

function createFailureCard(rule = {}) {
  return `
    <article class="card card-failure">
      <span class="pill">${getRuleTag(rule)}</span>
      <h3>${getRuleTitle(rule)}</h3>
      <p>${truncate(getRuleSymptom(rule), 150)}</p>
      <small>${truncate(getRuleEvidencePreview(rule), 120)}</small>
      <a href="runbooks/${firstString(rule.id, 'index')}.html">View runbook</a>
    </article>
  `;
}

function createRunbookTeaser(rule = {}) {
  return `
    <article class="card card-runbook">
      <span class="pill">${firstString(rule.id && humanizeId(rule.id), 'Runbook')}</span>
      <h3>${getRuleTitle(rule)}</h3>
      <p>${truncate(firstString(rule.safeNextStep, getRuleSymptom(rule)), 145)}</p>
      <a href="runbooks/${firstString(rule.id, 'index')}.html">Open runbook</a>
    </article>
  `;
}

function createRunbookCard(rule = {}) {
  return `
    <article class="runbook-card">
      <small class="small-tag">${getRuleTag(rule)}</small>
      <strong>${getRuleTitle(rule)}</strong>
      <p>${truncate(getRuleSymptom(rule), 150)}</p>
      <p>Evidence: ${truncate(getRuleEvidencePreview(rule), 140)}</p>
      <p><a href="${firstString(rule.id, 'index')}.html">View details</a></p>
    </article>
  `;
}