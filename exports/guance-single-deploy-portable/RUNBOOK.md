# Guance Single-Host Runbook

## 0. Confirm Scope

- single Linux host only
- not cluster deployment
- not online deployment
- root or sudo available
- prefer low-resource single-replica choices

Verification:

- one host only
- `*.guance.local` selected

## 1. Check Host Baseline

- check OS, CPU, RAM, disk, SELinux, firewall, time sync, hostname
- confirm the machine is really reusable or clean enough
- check conflicting ports: `80/443/30001/30928`
- create working directories
- set `vm.max_map_count=262144`

Verification:

- host shape is acceptable, preferably `16C32G`
- no critical port conflict
- outbound network and SSH are stable

## 2. Bootstrap Single-Node Kubernetes

- use `sealos`
- do not switch bootstrap method unless explicitly requested
- bring Kubernetes up before middleware

Verification:

- node is `Ready`
- control-plane pods are healthy
- API server is stable

## 3. Prepare Storage And Ingress

- create NFS path
- deploy NFS provisioner
- create or verify StorageClass
- deploy ingress
- prefer `hostNetwork: true`

Verification:

- PVC dynamic provisioning works
- ingress is healthy
- `80/443` are actually served by ingress

## 4. Deploy Middleware

- install and verify:
  - MySQL
  - OpenSearch
  - GuanceDB
  - cache / NSQ components in the package set

Verification:

- middleware pods are `Running`
- service DNS works inside the cluster

## 5. Deploy Launcher

- install launcher
- before opening launcher UI, set:
  - `debug: True`
  - restart launcher

Verification:

- launcher deployment is healthy
- launcher API is reachable

## 6. Run Launcher Install

- prefer browser automation if launcher UI is reachable
- if launcher UI is not reachable from the operator machine, use launcher APIs from the launcher pod
- use in-cluster service addresses
- wait for install completion

Verification:

- business namespaces are created
- business workloads are created

## 7. Standardize Domains

- prefer:
  - `dataflux.guance.local`
  - `df-management.guance.local`
  - `df-api.guance.local`
  - `df-management-api.guance.local`
  - `launcher.guance.local`

Verification:

- management and front page open on final hostnames

## 8. Verify Post-Install Initialization

- do not stop at green pods
- verify:
  - launcher service status
  - `workspace/init`
  - `metering/init`
  - `df_core.main_workspace` contains `wksp_system`
  - system workspace token exists

If `wksp_system` is missing:

- inspect `df_core.main_es_instance`
- inspect `kodo-inner` logs
- confirm OpenSearch was not saved as `provider=elastic`

## 9. Clean Abnormal Pods

- remove stale or historical failed pods
- troubleshoot active failed pods before hand-off

Verification:

- no critical active workload is broken

## 10. Activate License

- activate through launcher API with:
  - `ak`
  - `sk`
  - `license`
  - `dataway_url`

Verification:

- activation returns success

## 11. Verify Admin Login

- verify management login
- if first login forces password change, complete it
- retest with final password

## 12. Create Test Member And Workspace

- create one member
- create one workspace
- bind the member correctly

## 13. Verify Front-End Login

- use the member account to log in
- confirm the member reaches the intended workspace
- if `/api/v1/workspace/account/permissions` returns `403`, repair permission seeds

## 14. Final Hand-Off

- confirm no temporary bypass is still enabled
- report:
  - final URLs
  - admin account
  - test member account
  - license state
  - remaining caveats
