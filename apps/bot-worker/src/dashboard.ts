import { EnvBindings } from './types/discord';
import { readDashboardData, COMMAND_NAMES, DashboardData } from './telemetry';
import incidentSamples from '../../fixtures/incidents/dashboard-samples.json';

export interface IncidentSample {
  id: string;
  title: string;
  summary: string;
  timestamp: string;
  lesson: string;
}

const INCIDENT_SAMPLES: IncidentSample[] = incidentSamples;

function formatTimestamp(value?: string): string {
  if (!value) {
    return 'Not recorded yet';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('en-US', { timeZone: 'UTC', hour12: false });
}

export function renderDashboardHtml(data: DashboardData, incidents: IncidentSample[] = INCIDENT_SAMPLES): string {
  const healthSection = data.lastHealth
    ? `<p><strong>Timestamp:</strong> ${formatTimestamp(data.lastHealth.timestamp)}</p>
       <p><strong>Environment:</strong> ${data.lastHealth.environment ?? 'unknown'}</p>`
    : '<p>No successful health checks recorded yet.</p>';

  const diagnosisSection = data.lastDiagnosis
    ? `<p><strong>${data.lastDiagnosis.label}</strong> (${data.lastDiagnosis.ruleId})</p>
       <p>Recommended next step: ${data.lastDiagnosis.safeNextStep}</p>
       <p><small>Captured ${formatTimestamp(data.lastDiagnosis.timestamp)}</small></p>`
    : '<p>No diagnoses captured yet.</p>';

  const commandList = COMMAND_NAMES.map((command) => {
    const count = data.commandCounts[command] ?? 0;
    return `<li><span>${command}</span><strong>${count}</strong></li>`;
  }).join('');

  const incidentMarkup = incidents
    .map(
      (incident) => `
        <article>
          <h4>${incident.title}</h4>
          <p>${incident.summary}</p>
          <p class="lesson">Lesson: ${incident.lesson}</p>
          <p class="timestamp">${formatTimestamp(incident.timestamp)}</p>
        </article>
      `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>BotMedic dashboard</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: system-ui, 'Segoe UI', sans-serif;
        background-color: #0f1115;
        color: #f5f6fb;
      }
      body {
        margin: 0;
        padding: 32px;
      }
      h1,
      h2,
      h3,
      h4 {
        margin: 0 0 8px;
        color: #ffffff;
      }
      main {
        display: grid;
        gap: 24px;
        max-width: 960px;
        margin: 0 auto;
      }
      section {
        background: #131824;
        border: 1px solid #20283c;
        border-radius: 12px;
        padding: 20px;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      li {
        flex: 1 1 140px;
        padding: 12px;
        border-radius: 10px;
        background: #1e2536;
        border: 1px solid #2b3350;
      }
      li span {
        display: block;
        font-size: 0.85rem;
        color: #97a3c4;
      }
      li strong {
        font-size: 1.25rem;
      }
      article {
        border-bottom: 1px solid #1c2337;
        padding-bottom: 12px;
        margin-bottom: 12px;
      }
      article:last-child {
        border-bottom: none;
      }
      .lesson {
        color: #b3c3ff;
      }
      .timestamp {
        font-size: 0.8rem;
        color: #7a83a3;
      }
      .note {
        font-size: 0.9rem;
        color: #99a5c6;
      }
      footer {
        text-align: center;
        font-size: 0.8rem;
        color: #7a83a3;
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>BotMedic dashboard</h1>
        <p class="note">Last observed telemetry stored in Workers KV (fallbacks when the namespace is missing).</p>
      </header>
      <section>
        <h2>Command usage</h2>
        <ul>${commandList}</ul>
      </section>
      <section>
        <h2>Last successful /health</h2>
        ${healthSection}
      </section>
      <section>
        <h2>Last failed diagnosis</h2>
        ${diagnosisSection}
      </section>
      <section>
        <h2>Recent incident samples</h2>
        ${incidentMarkup}
      </section>
    </main>
    <footer>BotMedic · ${new Date().toISOString()}</footer>
  </body>
</html>`;
}

export async function handleDashboardRequest(request: Request, env: EnvBindings): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== '/dashboard') {
    return new Response('Not found', { status: 404 });
  }
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const data = await readDashboardData(env);
  const body = renderDashboardHtml(data);
  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8'
    }
  });
}
