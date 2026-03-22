# Guance Single Deploy Portable Skill

This is a portable export of the Guance single-host deployment skill.

It is designed for tools such as OpenClaw or other AI agents that do not understand Codex-specific skill links, directives, or built-in tool semantics.

## Scope

Use this package only for:

- Guance single-machine deployment
- one clean Linux host
- launcher-based install flow
- low-resource or single-replica preference

Do not use this package for:

- cluster deployment
- online deployment
- HA design

## How To Use In Other AI Tools

Recommended order:

1. Put this file into the AI tool's system prompt or task context.
2. Attach `RUNBOOK.md`, `COMMANDS.md`, and `PITFALLS.md` as reference files.
3. Tell the agent:
   - follow the single-host path only
   - check the live environment before every major action
   - prefer `*.guance.local`
   - do not switch to cluster logic
   - validate `wksp_system` before declaring success

## Minimal System Prompt Wrapper

You are deploying Guance on one Linux host by the single-deploy path only.

Rules:

- Follow the single-host launcher workflow only.
- Check the current environment before each step.
- Prefer `sealos` for single-node Kubernetes bootstrap unless the user explicitly asks otherwise.
- Prefer `*.guance.local` and hosts mapping instead of `*.ip.nip.io`.
- Keep replicas and resource usage conservative.
- Before launcher browser work, set `debug: True` in `launcher-settings`.
- Do not stop at pod health alone.
- After install, verify:
  - `workspace/init`
  - `metering/init`
  - `df_core.main_workspace` contains `wksp_system`
  - license activation succeeded
- If OpenSearch is in use but `df_core.main_es_instance.configJSON.provider` is `elastic`, correct it to `opensearch` and rerun post-install initialization.
- If front-end member login returns `ft.Forbidden`, inspect permission seed data before blaming credentials.

## Portability Notes

This export intentionally removes or avoids:

- Codex skill links
- Codex-only directives
- Codex UI metadata
- assumptions about a specific browser automation wrapper

You can map the browser step to whatever the target platform supports:

- Playwright
- Selenium
- remote Chrome automation
- direct launcher APIs if UI access is blocked

## Files

- `RUNBOOK.md`: standard execution checklist
- `COMMANDS.md`: command skeletons
- `PITFALLS.md`: proven failure modes and repairs
- `OPENCLAW_PROMPT.md`: a ready-to-paste prompt pack for OpenClaw-style agents
