---
name: guance-launcher-deploy
description: Use when deploying Guance/观测云 on self-built infrastructure with the launcher flow. Classify by online vs offline image delivery instead of single-node vs multi-node. Covers sealos-based Kubernetes bootstrap, middleware deployment, optional low-resource launcher settings, browser automation, local hosts domains, post-install license activation, and validation of member/workspace, DataWay, and DataKit.
---

# Guance Launcher Deploy

Use this skill for Guance self-built deployments driven by `launcher`.

Choose the workflow by **image delivery path** first:

- `online`: cluster nodes can pull Guance and middleware images directly
- `offline`: images must be imported from offline packages or pushed into a private registry first

Do **not** classify the task by `single-node` vs `multi-node` first. For Guance self-built deployments, `sealos` is still the default Kubernetes path in both cases. Topology mainly changes node lists and resource sizing.

## Inputs To Collect

- Access to all target nodes: IPs, auth method, root or sudo access
- SSH port and whether passwordless login already exists
- Deployment path: `online` or `offline`
- Cluster topology: single-node POC or multi-node cluster
- Host shape: OS, CPU, RAM, disk, public/private IPs
- Registry reachability:
  - online pull allowed or not
  - private registry available or not
  - offline package location if applicable
- Domain strategy: prefer local hosts-based domains such as `*.guance.local`
- Whether the current operator machine can directly open launcher and business domains
- Launcher install choice: whether to enable single-replica / low-resource mode before starting the browser flow
- Activation data if available: `ak`, `sk`, `license`, `dataway_url`
- Validation scope after install if requested:
  - create member and workspace
  - verify front-end login
  - create and verify `DataWay`
  - deploy and verify `DataKit`

## Start Every Session By Asking

- Ask the deployment path first: `online` or `offline`.
- Ask the core access information next:
  - target IPs or hostnames
  - login method such as password or SSH key
  - login user such as `root`
  - SSH port if it is not `22`
- Ask the topology after that:
  - single-node POC
  - multi-node cluster
- Ask whether the user wants `single-replica / low-resource` mode before the launcher install starts.
- Ask whether the user wants only the base install, or also wants post-install validation such as member/workspace, `DataWay`, and `DataKit`.
- If the user already supplied some of this information in the thread, confirm only the missing pieces instead of asking everything again.

## Preferred Intake Format

- Prefer asking the user to fill or supplement a short parameter block instead of scattering follow-up questions across many turns.
- If the user already supplied some fields, show only the missing or ambiguous ones.
- Use a compact copy-paste template like this:

```text
请补充这些核心参数：

[必填]
- 部署路径：online / offline
- 节点信息：
  - 控制平面节点：
  - 工作节点：
- 登录方式：password / ssh key
- SSH 端口：22
- 登录用户：root / sudo user
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
- 激活信息（如果已有）：
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

- If the task is already underway, use a delta version instead of the full template:

```text
继续之前请补充缺失参数：
- 部署路径：
- 节点信息 / SSH 端口 / 登录方式 / 用户：
- 镜像可达性：
- 是否低资源模式：
- 当前操作机是否可访问相关域名：
- 是否需要继续验证 DataWay / DataKit：
```

## First Decision: Online Or Offline

- Use the `online` path when Kubernetes nodes can reach the required image registries. The official docs expose this under `应用镜像获取 -> 在线部署方式`.
- Use the `offline` path when nodes cannot pull images directly and the environment must consume tarballs or a private registry.
- Do not guess based on node count. A one-node POC can still be `online`, and a three-node cluster can still be `offline`.
- Treat `single-replica` as a launcher configuration decision, not as the deployment mode itself.

## Hard Guardrails

- Keep `sealos` as the default Kubernetes bootstrap for self-built deployments unless the user explicitly asks for another installer.
- Treat `single-replica` as a low-resource POC choice, not as production HA guidance.
- Decide and apply single-replica / low-resource launcher settings **before** the launcher browser install starts.
- If the exact `launcher-settings` keys are not already known, inspect the current ConfigMap or use user-provided overrides before guessing.
- Prefer `*.guance.local + /etc/hosts` over `*.nip.io` style domains on unstable networks or clouds with DNS quirks.
- `launcher` install completion is not enough. Always verify `workspace/init`, `metering/init`, system workspace creation, and license activation.
- If the user asked to validate the environment, keep going through management login, front-end login, workspace bootstrap, and requested integration checks instead of stopping after green pods.
- Treat permission bootstrap as part of install validation. A member existing is not enough if permission seed data is missing.
- Treat `DataWay` success as an end-to-end result, not only a pod result. The management backend should show the created gateway and its version after the gateway connects back.
- `DataWay` returning `404` on `/` is normal. Use version presence in the management list and live TCP reachability to judge success.
- Prefer a standard user-facing `DataWay` created from launcher or management UI. Do not default `DataKit` to `internal-dataway`.
- If a created `DataWay` is healthy in-cluster but not reachable from outside, check `NodePort`, host networking or `hostPort`, cloud security groups, and host firewalls before blaming the gateway.
- If the live environment diverges from the runbook, stop and branch through the references instead of forcing the checklist linearly.

## Execution Model

- Start with [references/runbook.md](./references/runbook.md) to choose the path.
- Then follow exactly one main runbook:
  - [references/online-runbook.md](./references/online-runbook.md)
  - [references/offline-runbook.md](./references/offline-runbook.md)
- Use [references/runbook-commands.md](./references/runbook-commands.md) for reusable command skeletons.
- Use [references/pitfalls.md](./references/pitfalls.md) when verification fails or the environment is already half-installed.
- Use [references/activation.md](./references/activation.md) after the install path is complete.

## Workflow

### 1. Confirm Scope

- Continue when the user wants Guance on self-built infrastructure with `launcher`.
- Continue for both single-node and multi-node `sealos` clusters.
- Stop and switch workflows only if the user explicitly wants a non-`launcher` path or a different platform-specific deployment model.

### 2. Choose The Deployment Path

- If nodes can pull required images, choose `online`.
- If nodes need preloaded images or a private registry, choose `offline`.
- Record the actual reason for the choice:
  - internet reachable
  - internet blocked
  - registry mirror available
  - offline package only

### 3. Confirm Topology And Resource Mode

- Collect whether the target is:
  - single-node POC
  - multi-node cluster
- Ask before launcher install whether business components should be started in `single-replica / low-resource` mode.
- Keep that choice separate from the image path.

### 4. Bootstrap Kubernetes With `sealos`

- Use the same `sealos` foundation for both single-node and multi-node self-built deployments.
- Extend the cluster by adding nodes, not by switching deployment families.
- If the cluster is already half-broken and control-plane static pods keep flapping, prefer a clean reinstall over prolonged in-place repair.

### 5. Prepare Storage, Ingress, And Middleware

- Bring up storage and ingress after Kubernetes is healthy.
- Then deploy middleware in the path-specific way:
  - `online`: pull required images directly from reachable registries
  - `offline`: preload images or use a private registry first
- Keep service addresses aligned with the official docs and prefer in-cluster addresses for launcher form input.

### 6. Install `launcher`

- For the `online` path, prefer the official `helm repo add/update/install` flow.
- For the `offline` path, make sure the launcher image/chart source has already been prepared.
- Do not start the browser flow until launcher pods and APIs are healthy.

### 7. Apply Optional Single-Replica Settings Before Browser Install

- If the user chose low-resource mode, patch `launcher-settings` before using the launcher UI.
- Keep `debug: True` available for low-resource troubleshooting when appropriate.
- Apply the agreed single-replica or component-scale overrides first, then restart the launcher deployment.

```bash
kubectl edit cm launcher-settings -n launcher
kubectl -n launcher rollout restart deploy launcher
```

### 8. Use Browser Automation For The Launcher Flow

- Use the local `playwright` skill for the launcher UI when it is available.
- Fill middleware endpoints carefully and prefer in-cluster service names.
- Wait for the install status page to finish; do not stop after the first success toast or progress jump.
- If the operator machine cannot reliably reach the launcher page, fall back to launcher APIs and cluster-side checks rather than blocking on the browser alone.

### 9. Fix Final Domains Before Hand-Off

- Standardize on final business domains such as:
  - `dataflux.guance.local`
  - `df-management.guance.local`
  - `df-api.guance.local`
  - `df-management-api.guance.local`
  - `launcher.guance.local`
- Update ingress hosts and ConfigMaps if the environment was first installed with a temporary hostname.

### 10. Activate And Validate

- Activate license after install completion by using launcher APIs.
- Validate:
  - launcher install state
  - management UI
  - front-end UI
  - final domains
  - `workspace/init`
  - `metering/init`
  - `wksp_system` in `df_core.main_workspace`

### 11. Finish The Environment, Not Just The Install

- Keep going until:
  - critical abnormal pods are handled
  - first-login password flow is completed if required
  - a member and workspace can be created
  - the member can log in to the front-end
- Also confirm permission seed integrity:
  - `biz_permission` is not empty
  - `biz_role_permission` is not empty
- If front-end login fails with `ft.Forbidden`, treat it as a bootstrap or permission-seed problem before blaming the account.

### 12. Validate Management And Front-End Bootstrap

- If the user wants validation, verify the management backend with a real login instead of API health alone.
- Complete the first-login password reset when the management backend forces it.
- Create a test member and workspace.
- Verify the member can log in to `dataflux` and lands in the expected workspace.
- If `workspace/change` or `workspace/account/permissions` returns `ft.Forbidden`, check permission seed tables and cached member permissions before changing account bindings.
- If `biz_permission` or `biz_role_permission` is empty, recover with backend permission initialization, then refresh workspace-member permission cache before retrying the UI flow.
- Use the validated recovery sequence when needed:
  - run `reset_init_permissions()`
  - run `refresh_workspace_member_permission_cache([...])`
- If workspace creation in the UI gets blocked by async selectors, use the management backend API with the real `ownerUuid` instead of fighting the widget.

### 13. Validate `DataWay` When Requested

- Support both user-facing paths:
  - launcher top-right settings and one-click `DataWay`
  - management backend create `DataWay`, then deploy it with Kubernetes YAML
- Prefer the management backend route when the goal is explicit verification because it returns a concrete `DW_UUID` and `DW_TOKEN`.
- Prefer the standard public or user-facing `DataWay` for downstream integrations. Do not treat `internal-dataway` as the normal result.
- For Kubernetes deployment:
  - keep `DW_REMOTE_HOST=http://kodo.forethought-kodo:9527`
  - use the returned `DW_UUID` and `DW_TOKEN`
  - expose `9528` in a way that matches the user environment such as `NodePort`, `LoadBalancer`, ingress, or `hostPort`
- Success criteria:
  - the gateway pod is `Running`
  - the management backend `DataWay` list shows the created gateway
  - the `Version` column is populated
  - external reachability is confirmed if the user asked for a public endpoint
- A `404` response on `http://<dataway-host>:<port>/` is acceptable and usually means the endpoint is alive.
- If the requested public endpoint fails, first test the same standard `DataWay` over node IP or private reachability before falling back to any internal-only route.

### 14. Validate `DataKit` When Requested

- Get the real `DK_DATAWAY` from the target workspace front-end under `集成 -> DataKit`.
- Do not guess or hardcode the workspace token when the control plane can provide the exact `DK_DATAWAY` value.
- Prefer the standard `DataWay` created for the workspace or launcher flow.
- Do not default to `internal-dataway`; only use it as a temporary debug path if the user explicitly approves and label it as non-standard.
- For Kubernetes deployment, use the official `DaemonSet` manifest and patch:
  - `ENV_DATAWAY`
  - `ENV_CLUSTER_NAME_K8S`
- Keep the manifest otherwise as close to upstream as practical.
- Success criteria:
  - the `datakit` `DaemonSet` rolls out successfully
  - `DataKit` pods are `Running`
  - the container environment contains the patched `ENV_DATAWAY`
  - startup logs show expected default inputs without obvious connection failures
  - live connections or successful uploads can be observed toward the chosen standard `DataWay`

### 15. Practical Validation Shortcuts

- Use the management backend auth cookie or token to call backend APIs when the UI is awkward but the browser session is already authenticated.
- When validating front-end or management flows, use the local `playwright` skill when it is available instead of manual guesswork.
- When validating `DataKit`, prefer checking the generated install command in the workspace UI first, then mirror its `DK_DATAWAY` into the Kubernetes manifest.
- If the user says “single deploy” but the environment is still launcher + sealos based, keep using this skill and classify by `online` or `offline` first.

## Fast Recovery Heuristics

- If SSH and HTTP both stall during install, suspect host pressure first.
- If online image pulls fail repeatedly, stop and reclassify the environment as `offline/private-registry` instead of retrying forever.
- If business domains fail but direct IP returns ingress default `404`, suspect host mismatch or domain config.
- If management page loads but APIs return `ft.InvalidLicense`, activate first.
- If management or front-end APIs return MySQL `(1040, 'Too many connections')`, inspect `max_connections`, `Threads_connected`, `Max_used_connections`, and `information_schema.processlist` before restarting random services.
- For this self-built deployment shape, default MySQL `max_connections=151` may be too low; raising and persisting it can be the cleanest recovery.
- If `kodo` or `kodo-inner` logs mention `NSQ no pub available`, review whether low-resource scaling removed required NSQ components.
- If all business pods look `Running` but `wksp_system` is still missing, treat it as initialization failure, not success.
- If OpenSearch was chosen but `main_es_instance.configJSON.provider` became `elastic`, correct it to `opensearch` before retrying initialization.

## References

- Path selection overview: [references/runbook.md](./references/runbook.md)
- Online deployment runbook: [references/online-runbook.md](./references/online-runbook.md)
- Offline deployment runbook: [references/offline-runbook.md](./references/offline-runbook.md)
- Command skeletons: [references/runbook-commands.md](./references/runbook-commands.md)
- Pitfalls and recovery: [references/pitfalls.md](./references/pitfalls.md)
- License activation API: [references/activation.md](./references/activation.md)
