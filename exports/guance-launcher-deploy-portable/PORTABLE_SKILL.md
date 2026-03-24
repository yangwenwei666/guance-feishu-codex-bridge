# Guance Launcher Deploy Portable Skill

This is a portable export of the Guance launcher deployment skill.

It is designed for tools such as OpenClaw or other AI agents that do not understand Codex-specific skill links, directives, or built-in tool semantics.

## Scope

Use this package for:

- Guance self-built deployment with `launcher`
- `online` or `offline` image delivery
- `sealos`-based Kubernetes deployment
- single-node POC or multi-node cluster
- optional low-resource or single-replica launcher choices
- optional post-install validation of member/workspace, `DataWay`, and `DataKit`

Do not use this package for:

- non-`launcher` deployment paths
- cloud-vendor-specific managed deployment workflows
- unrelated Kubernetes troubleshooting without Guance deployment intent

## How To Use In Other AI Tools

Recommended order:

1. Put this file into the AI tool's system prompt or task context.
2. Attach `RUNBOOK.md`, `COMMANDS.md`, and `PITFALLS.md` as reference files.
3. Tell the agent:
   - classify by `online` or `offline` first
   - collect IPs, SSH port, login method, login user, topology, operator reachability, and low-resource choice first
   - prefer `sealos`
   - prefer `*.guance.local`
   - validate `wksp_system` before declaring base install success
   - keep going into `DataWay` and `DataKit` only if requested

## Preferred Intake Template

Ask the user to fill or补充 a short parameter block before execution. Prefer this over many scattered follow-up questions.

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

If the deployment is already in progress, ask only for the missing fields.

## Minimal System Prompt Wrapper

You are deploying Guance on self-built infrastructure by the launcher path.

Rules:

- Classify the task by `online` or `offline` image delivery first.
- Ask for target IPs, login method, login user, topology, and low-resource choice first.
- Ask for SSH port and whether the operator machine can directly reach launcher and business domains.
- Use `sealos` unless the user explicitly asks for another bootstrap method.
- Prefer `*.guance.local` and hosts mapping instead of unstable wildcard DNS shortcuts.
- Treat low-resource mode as a launcher setting, not as the deployment mode itself.
- Before launcher browser work, apply agreed low-resource settings first.
- Do not stop at pod health alone.
- After install, verify:
  - `workspace/init`
  - `metering/init`
  - `df_core.main_workspace` contains `wksp_system`
  - license activation succeeded
- If OpenSearch is in use but `df_core.main_es_instance.configJSON.provider` is `elastic`, correct it to `opensearch` and rerun post-install initialization.
- If front-end member login returns `ft.Forbidden`, inspect permission seed data before blaming credentials.
- A member or workspace existing is not enough; verify `biz_permission` and `biz_role_permission` are populated.
- If `workspace/change` or `workspace/account/permissions` returns `ft.Forbidden`, repair permission seeds and refresh workspace-member permission cache.
- If validating `DataWay`, use management backend version visibility as the real success signal.
- Prefer a standard user-facing `DataWay` from launcher or management UI; do not default `DataKit` to `internal-dataway`.
- If validating `DataKit`, fetch the real `DK_DATAWAY` from the target workspace front-end before patching the Kubernetes manifest.
- If APIs return MySQL `Too many connections`, inspect `max_connections`, `Threads_connected`, `Max_used_connections`, and `processlist` before restarting services.

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
