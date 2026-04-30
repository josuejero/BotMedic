# Security policy

## Supported project status

BotMedic is a portfolio project and demo incident-triage platform. Security issues can be reported through GitHub issues or direct contact through the repository owner profile.

## What to report

Please report suspected vulnerabilities involving Discord request verification, secret handling, dependency vulnerabilities, unsafe output rendering, or telemetry exposure.

## Current safeguards

- Discord Ed25519 signature verification before command routing
- Negative tests for invalid request signatures
- Ephemeral Discord responses for diagnostic output
- GitHub Dependabot configuration
- CodeQL code scanning
- OpenSSF Scorecard workflow
