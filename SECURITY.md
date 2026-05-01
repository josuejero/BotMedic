# Security policy

## Supported project status

BotMedic is a portfolio project and demo Discord incident-triage platform. Security issues in the current `main` branch are in scope.

## Reporting a vulnerability

Please do not open a public GitHub issue for suspected vulnerabilities.

Report privately through GitHub Security Advisories:

https://github.com/josuejero/BotMedic/security/advisories/new

If private vulnerability reporting is unavailable, contact the repository owner through the GitHub profile listed on the repository.

## What to report

Please report vulnerabilities involving:

- Discord request signature verification
- Secret handling or accidental credential exposure
- Unsafe rendering of user-controlled content
- Dependency vulnerabilities with an exploitable path
- Telemetry exposure or dashboard data leakage
- GitHub Actions workflow compromise risks

## Response expectations

I will try to acknowledge valid vulnerability reports within 7 days.

For confirmed vulnerabilities, I will document the affected area, fix plan, and expected disclosure timing. Public disclosure should wait until a fix is available or until 90 days after acknowledgement, unless earlier disclosure is mutually agreed.

## Current safeguards

- Discord Ed25519 signature verification before command routing
- Negative tests for invalid request signatures
- Ephemeral Discord responses for diagnostic output
- GitHub Dependabot configuration
- CodeQL code scanning
- OpenSSF Scorecard workflow
