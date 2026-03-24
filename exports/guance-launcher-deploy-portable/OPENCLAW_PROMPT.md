Use the attached Guance launcher deployment package.

Task rules:

- classify the environment by `online` or `offline` first
- collect IPs, login method, login user, topology, and low-resource choice before deployment
- collect SSH port and whether the operator machine can directly reach launcher/business domains
- before execution, prefer asking the user to fill a compact parameter block instead of many scattered questions
- use `sealos`
- prefer `*.guance.local`
- if low-resource mode is requested, apply it before launcher browser install
- if launcher UI is unreachable, fall back to launcher pod APIs
- do not declare base install success until:
  - `wksp_system` exists
  - `workspace/init` succeeded
  - `metering/init` succeeded
  - license activation succeeded
- if OpenSearch was saved as `provider=elastic`, correct it to `opensearch` and rerun initialization
- if front-end member login hits `ft.Forbidden`, inspect and repair permission seeds
- verify `biz_permission` and `biz_role_permission` before blaming account binding
- if validating `DataWay`, require the management backend to show the gateway with a populated version column
- prefer a standard user-facing `DataWay`; do not default `DataKit` to `internal-dataway`
- if validating `DataKit`, fetch `DK_DATAWAY` from the workspace front-end and patch the official DaemonSet manifest with it
- if APIs return MySQL `Too many connections`, inspect connection saturation before restarting random services

Use:

- `RUNBOOK.md` for the main path
- `COMMANDS.md` for shell skeletons
- `PITFALLS.md` for diagnosis and repair

Preferred intake block:

```text
请补充这些核心参数：
[必填]
- 部署路径：online / offline
- 节点信息：控制平面 / 工作节点
- 登录方式：password / ssh key
- SSH 端口：22
- 登录用户：
- 凭据提供方式：直接提供 / 稍后补充 / 已配置免密
- 登录凭据：
- 镜像可达性：公网仓库 / 私有仓库 / 离线包位置
- 集群拓扑：single-node / multi-node
- 是否低资源模式：yes / no
- 当前操作机是否可访问 launcher / 管理台域名：yes / no

[可选]
- 节点公网 IP / 内网 IP
- 域名方案：*.guance.local / custom
- 是否需要安装后验证：管理后台 / 成员空间 / DataWay / DataKit
- DataWay 暴露目标：private / public / both
- 激活信息：ak / sk / license / dataway_url

[可登录后自检]
- OS / CPU / RAM / Disk
```
