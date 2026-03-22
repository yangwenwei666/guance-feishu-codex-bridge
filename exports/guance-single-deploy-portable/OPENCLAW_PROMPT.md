Use the attached Guance single-host deployment package.

Task rules:

- follow single-deploy only
- do not use cluster logic
- check the environment before each major action
- prefer `sealos`
- prefer `*.guance.local`
- keep resource usage conservative
- before launcher install, set `debug: True` in `launcher-settings`
- if launcher UI is unreachable, fall back to launcher pod APIs
- do not declare success until:
  - `wksp_system` exists
  - `workspace/init` succeeded
  - `metering/init` succeeded
  - license activation succeeded
- if OpenSearch was saved as `provider=elastic`, correct it to `opensearch` and rerun initialization
- if front-end member login hits `ft.Forbidden`, inspect and repair permission seeds

Use:

- `RUNBOOK.md` for the main path
- `COMMANDS.md` for shell skeletons
- `PITFALLS.md` for diagnosis and repair
