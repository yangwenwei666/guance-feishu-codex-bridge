# Guance Single-Host Pitfalls

## Resource Pressure

- `8C16G` is easy to overload
- safer target is `16C32G`
- overload symptoms:
  - SSH timeouts
  - launcher timeouts
  - pods stuck in `ContainerCreating`

## Bootstrap Drift

- use `sealos`
- do not improvise with `kubeadm`, `k3s`, or other installers unless explicitly requested

## Control Plane Failures

- common blockers:
  - blocked image registries
  - static pod manifests still pointing at blocked registries
  - missing `audit-policy.yml`
- if the cluster is half-broken, `sealos reset --force` is often faster than in-place repair

## Domain Choice

- prefer `*.guance.local`
- avoid `*.ip.nip.io` as the final domain in this workflow

## Launcher UI Not Reachable

- do not block the whole deployment on browser access alone
- use launcher pod APIs as fallback
- still enforce the same completion checks

## NSQ Over-Shrinking

- scaling `nsqd2` or `nsqd3` to `0` can break kodo startup
- symptoms:
  - `NSQ no pub available`
  - `kodo-inner` unavailable

## System Workspace Missing

- all business pods may be green while `wksp_system` is still missing
- do not assume it was deleted
- first verify:
  - `workspace/init`
  - `metering/init`
  - `df_core.main_workspace`
  - `kodo-inner` logs

## OpenSearch Saved As Elastic

- launcher may save OpenSearch into MySQL with:

```json
{"provider":"elastic"}
```

- this can break post-install initialization
- symptoms:
  - `workspace/init` returns `500`
  - `wksp_system` is missing
  - initialization behaves like Elasticsearch ILM against OpenSearch
- repair:
  - correct `df_core.main_es_instance.configJSON.provider` to `opensearch`
  - rerun `workspace/init`
  - rerun `metering/init`

## Front-End Permission Bootstrap Failure

- member login can succeed while front-end permission API still returns `403`
- check permission seed tables before blaming the account
- repair by running backend permission fix script and refreshing caches
