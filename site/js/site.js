import { commands, ruleCases } from './data.js';

const runbookMap = new Map(ruleCases.map((rule) => [rule.id, rule]));

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
  populateCards('[data-command-gallery]', commands, createCommandCard);
  populateCards('[data-failure-gallery]', ruleCases, createFailureCard);
  populateCards('[data-runbook-teaser]', ruleCases, createRunbookTeaser);
  renderQuickReferenceSummary();
}

function renderRunbookLibrary() {
  populateCards('[data-runbook-list]', ruleCases, createRunbookCard);
}

function renderRunbookDetail() {
  const container = document.querySelector('[data-runbook-detail]');
  const runbookId = document.body.dataset.runbook;
  if (!container || !runbookId) return;
  const runbook = runbookMap.get(runbookId);
  if (!runbook) {
    container.textContent = 'Runbook not found';
    return;
  }
  const nameEl = document.querySelector('[data-runbook-name]');
  const labelEl = document.querySelector('[data-runbook-label]');
  const symptomEl = document.querySelector('[data-runbook-symptom]');
  const confidenceEl = document.querySelector('[data-runbook-confidence]');
  if (nameEl) {
    nameEl.textContent = runbook.label;
  }
  if (labelEl) {
    labelEl.textContent = runbook.id;
  }
  if (symptomEl) {
    symptomEl.textContent = runbook.symptom;
  }
  if (confidenceEl) {
    confidenceEl.textContent = `Confidence ${runbook.confidence}%`;
  }

  const breakdown = runbook.safeRecoverySteps.map((step) => `<li>${step}</li>`).join('');
  const checks = runbook.firstChecks.map((check) => `<li>${check}</li>`).join('');

  container.innerHTML = `
    <section class="runbook-columns">
      <article class="column">
        <h3>Polished explanation</h3>
        <p>${runbook.customerSafeExplanation}</p>
        <h4>Customer-safe response</h4>
        <p>${runbook.safeNextStep}</p>
        <h4>Safe recovery steps</h4>
        <ul>${breakdown}</ul>
      </article>
      <article class="column">
        <h3>Support logic</h3>
        <p><strong>Diagnosis:</strong> ${runbook.diagnosis}</p>
        <p><strong>Likely cause:</strong> ${runbook.likelyCause}</p>
        <h4>Evidence &amp; checks</h4>
        <ul>${runbook.evidence.map((line) => `<li>${line}</li>`).join('')}</ul>
        <p><strong>Escalation threshold:</strong> ${runbook.escalationThreshold}</p>
        <p class="warning-banner">Don’t do this first: ${runbook.dontDoThisFirst}</p>
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
  if (!timeline) return;
  const sampleRule = ruleCases[0];
  timeline.innerHTML = `
    <ol>
      <li>
        Symptom intake: “${sampleRule.symptom}” triggered the flow.
      </li>
      <li>
        Rule scoring: evidence (${sampleRule.evidence.join(' · ')}) boosted confidence to ${sampleRule.confidence}%.
      </li>
      <li>
        Support layers: publish internal diagnosis + customer messaging and write ephemeral traces for reproducibility.
      </li>
    </ol>
  `;

  const comparison = document.querySelector('[data-support-vs-human]');
  if (comparison) {
    comparison.innerHTML = `
      <article class="column">
        <h4>Support logic</h4>
        <p>Diagnosis: ${sampleRule.diagnosis}</p>
        <p>Likely cause: ${sampleRule.likelyCause}</p>
        <p>First check: ${sampleRule.firstChecks[0]}</p>
      </article>
      <article class="column">
        <h4>Human story</h4>
        <p>${sampleRule.customerSafeExplanation}</p>
        <p>Customer gets: ${sampleRule.safeNextStep}</p>
      </article>
    `;
  }
}

function renderQuickReference() {
  const tableBody = document.querySelector('[data-reference-table-body]');
  if (!tableBody) return;
  tableBody.innerHTML = ruleCases
    .map(
      (rule) => `
        <tr>
          <td><strong>${rule.label}</strong><br><small>${rule.symptom}</small></td>
          <td><strong>${rule.firstChecks[0]}</strong><br>${rule.firstChecks.slice(1).join('<br>')}</td>
          <td>${rule.safeNextStep}</td>
          <td><a href="runbooks/${rule.id}.html">Open runbook</a></td>
        </tr>
      `
    )
    .join('');
}

function renderQuickReferenceSummary() {
  const container = document.querySelector('[data-reference-summary]');
  if (!container) return;
  const firstCheck = ruleCases[0]?.firstChecks[0] ?? 'Start with /envcheck';
  container.innerHTML = `
    <p>Priority checklist: <strong>${firstCheck}</strong></p>
    <p>Tip: Always run <code>/envcheck</code> before exploring the runbook library to ensure the environment bindings are healthy.</p>
  `;
}

function populateCards(selector, dataset, builder) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.innerHTML = dataset.map(builder).join('');
}

function createCommandCard(cmd) {
  return `
    <article class="card">
      <span class="pill">${cmd.icon}</span>
      <h3>/${cmd.name}</h3>
      <small>${cmd.description}</small>
    </article>
  `;
}

function createFailureCard(rule) {
  return `
    <article class="card">
      <span class="pill">Confidence ${rule.confidence}%</span>
      <h3>${rule.label}</h3>
      <p>${rule.symptom}</p>
      <small>${rule.evidence[0]}</small>
      <a href="runbooks/${rule.id}.html">View runbook</a>
    </article>
  `;
}

function createRunbookTeaser(rule) {
  return `
    <article class="card">
      <span class="pill">${rule.id}</span>
      <h3>${rule.label}</h3>
      <p>${rule.safeNextStep}</p>
      <a href="runbooks/${rule.id}.html">Open runbook</a>
    </article>
  `;
}

function createRunbookCard(rule) {
  return `
    <article class="runbook-card">
      <small class="small-tag">Confidence ${rule.confidence}%</small>
      <strong>${rule.label}</strong>
      <p>${rule.symptom}</p>
      <p>Evidence: ${rule.evidence.slice(0, 2).join(' · ')}</p>
      <p><a href="${rule.id}.html">View details</a></p>
    </article>
  `;
}
