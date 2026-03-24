# Guance Launcher Deploy Pitfalls

## Wrong First Classification

- do not split the workflow into single-node vs multi-node first
- split it into `online` vs `offline` first
- a one-node POC can still be `online`
- a three-node cluster can still be `offline`

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
- avoid temporary wildcard DNS as the final domain in this workflow

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
- a member record and workspace record are not enough by themselves; verify `biz_permission` and `biz_role_permission` are populated
- if `workspace/change` or `workspace/account/permissions` returns `ft.Forbidden`, inspect cached member permissions too
- repair by running backend permission initialization and refreshing caches

## DataWay Reachability Misread

- `DataWay` returning `404` on `/` is usually normal
- treat it as alive if the TCP endpoint responds and the management backend shows the gateway version
- prefer a standard user-facing `DataWay` from launcher or management UI
- if the gateway is healthy in-cluster but not reachable from outside, check:
  - `NodePort`
  - `hostPort`
  - cloud security groups
  - host firewall rules

## DataKit Misconfiguration

- do not guess `DK_DATAWAY`
- use the exact value from `集成 -> DataKit` in the target workspace
- do not default `DataKit` to `internal-dataway`
- if DataKit pods are running but data is missing, verify:
  - `ENV_DATAWAY`
  - `ENV_CLUSTER_NAME_K8S`
  - default inputs and startup logs

## MySQL Saturation

- if APIs return `(1040, 'Too many connections')`, inspect:
  - `max_connections`
  - `Threads_connected`
  - `Max_used_connections`
  - `processlist`
- this deployment profile can exhaust the default `151` connections under normal component load
- prefer raising and persisting `max_connections` instead of only restarting services
