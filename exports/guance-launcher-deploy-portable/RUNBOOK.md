# Guance Launcher Deploy Runbook

## 0. Confirm Scope

- self-built Guance deployment
- launcher-based workflow
- classify by `online` or `offline` first
- `sealos` is the default Kubernetes bootstrap
- single-node POC and multi-node cluster are both in scope
- root or sudo access is available on all target nodes

Verification:

- deployment path is explicitly chosen: `online` or `offline`
- target IPs and auth method are known
- topology and low-resource choice are known

## 1. Collect Inputs Before Action

- target IPs or hostnames
- login method: password or SSH key
- SSH port
- login user such as `root`
- topology:
  - single-node POC
  - multi-node cluster
- whether to enable low-resource or single-replica launcher settings
- whether the current operator machine can directly open launcher and business domains
- whether the user also wants post-install validation for member/workspace, `DataWay`, or `DataKit`

Recommended intake template:

```text
请补充这些核心参数：

[必填]
- 部署路径：online / offline
- 节点信息：
  - 控制平面节点：
  - 工作节点：
- 登录方式：password / ssh key
- SSH 端口：22
- 登录用户：
- 凭据提供方式：直接提供 / 稍后补充 / 已配置免密
- 登录凭据：
- 镜像可达性：
  - 是否可直连公网镜像仓库：yes / no
  - 私有仓库地址（如有）：
  - 离线包位置（offline 时必填）：
- 集群拓扑：single-node / multi-node
- 是否低资源模式：yes / no
- 当前操作机是否可访问 launcher / 管理台域名：yes / no

[可选]
- 节点公网 IP（如有）：
- 节点内网 IP（如有）：
- 域名方案：*.guance.local / custom
- 是否需要安装后验证：
  - 管理后台登录：yes / no
  - 成员与空间创建：yes / no
  - DataWay：yes / no
  - DataKit：yes / no
- DataWay 暴露目标：private / public / both
- 激活信息：
  - ak:
  - sk:
  - license:
  - dataway_url:

[可登录后自检]
- OS:
- CPU:
- RAM:
- Disk:
```

## 2. Check Host And Cluster Baseline

- check OS, CPU, RAM, disk, SELinux, firewall, time sync, hostname
- check outbound network reachability
- check conflicting ports: `80/443/30001/30928/30929`
- set `vm.max_map_count=262144`
- if cluster already exists, check nodes and control-plane health first

Verification:

- host shape is acceptable
- outbound network is stable enough for the chosen deployment path
- cluster or host is clean enough to continue

## 3. Bootstrap Kubernetes With `sealos`

- use `sealos` for both single-node and multi-node self-built deployments
- do not change deployment family based only on node count
- if the environment is badly broken, prefer clean rebuild over prolonged in-place repair

Verification:

- nodes are `Ready`
- control-plane pods are healthy
- API server is stable

## 4. Prepare Storage, Ingress, And Middleware

- prepare storage
- deploy ingress
- deploy middleware according to the chosen path:
  - `online`: pull images directly
  - `offline`: preload images or use private registry
- prefer in-cluster service addresses during launcher form input

Verification:

- PVC provisioning works
- ingress is healthy
- middleware pods are `Running`
- middleware service DNS works in cluster

## 5. Deploy Launcher

- install launcher
- if low-resource mode is requested, patch launcher settings before browser install starts
- restart launcher after settings changes

Verification:

- launcher deployment is healthy
- launcher API is reachable

## 6. Run Launcher Install

- use browser automation if the launcher UI is reachable
- otherwise use launcher pod APIs as fallback
- use in-cluster middleware addresses
- wait for true install completion instead of stopping at partial progress

Verification:

- business namespaces are created
- business workloads are created

## 7. Standardize Final Domains

- prefer:
  - `dataflux.guance.local`
  - `df-management.guance.local`
  - `df-api.guance.local`
  - `df-management-api.guance.local`
  - `launcher.guance.local`

Verification:

- management and front-end open on final hostnames

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

## 9. Activate License

- activate through launcher API with:
  - `ak`
  - `sk`
  - `license`
  - `dataway_url`

Verification:

- activation returns success
- license status endpoint is healthy

## 10. Verify Management And Front-End Bootstrap

- verify management login
- if first login forces password change, complete it
- create one test member
- create one test workspace
- verify the member can log in to the front-end

Verification:

- management backend works with the final password
- member can reach the expected workspace in front-end
- if front-end APIs return `ft.Forbidden`, verify `biz_permission` and `biz_role_permission` are populated before changing account bindings
- if needed, run permission initialization and refresh workspace-member permission cache, then retry the UI flow

## 11. Validate `DataWay` If Requested

- create `DataWay` in management backend or launcher settings
- prefer a standard user-facing `DataWay`; do not treat `internal-dataway` as the normal result
- if using Kubernetes YAML, fill returned `DW_UUID` and `DW_TOKEN`
- keep `DW_REMOTE_HOST=http://kodo.forethought-kodo:9527`
- expose the gateway through `NodePort`, `LoadBalancer`, ingress, or `hostPort` as needed

Verification:

- `DataWay` pod is `Running`
- management backend list shows the gateway
- `Version` column is populated
- external reachability is confirmed if the user requested a public endpoint
- `404` on `/` can still be acceptable if TCP reachability and control-plane status are correct

## 12. Validate `DataKit` If Requested

- open the target workspace front-end at `集成 -> DataKit`
- get the exact `DK_DATAWAY` from the generated install command
- prefer the standard `DataWay` created for the workspace or launcher flow
- do not default to `internal-dataway` unless the user explicitly accepts a temporary non-standard debug path
- patch the official `DaemonSet` manifest:
  - `ENV_DATAWAY`
  - `ENV_CLUSTER_NAME_K8S`
- deploy DataKit

Verification:

- `datakit` `DaemonSet` is ready
- DataKit pods are `Running`
- container env contains the expected `ENV_DATAWAY`
- startup logs show normal input loading without obvious connection failures
- live connections or successful uploads can be observed toward the chosen standard `DataWay`

## 13. Final Hand-Off

- confirm no temporary bypass is still enabled
- report:
  - final URLs
  - admin account
  - test member account
  - license state
  - `DataWay` result if validated
  - `DataKit` result if validated
  - remaining caveats

## 14. Troubleshooting Hotspots

- If front-end or management APIs report MySQL `(1040, 'Too many connections')`, inspect:
  - `SHOW VARIABLES LIKE 'max_connections'`
  - `SHOW STATUS LIKE 'Threads_connected'`
  - `SHOW STATUS LIKE 'Max_used_connections'`
  - `information_schema.processlist`
- For this deployment shape, default MySQL `151` connections may be too low; raising and persisting `max_connections` can be the cleanest recovery.
