# Feishu Codex Bridge

把飞书里的命令转给你这台 Mac 上的 Codex CLI 执行，再把结果回发到飞书。

这版先做的是本地可运行 MVP：

- 接收飞书消息事件
- 只处理以 `/codex` 开头的文本命令
- 根据 profile 选择本地项目目录和 Codex session
- 串行执行任务，避免同一台机器上的上下文打架
- 把执行结果回发到飞书聊天

## 适用场景

你在手机端飞书发：

```text
/codex guance 看一下最近的登录报错，先别改代码
```

你 Mac 上的 bridge 会：

1. 收到飞书事件
2. 进入 `guance` profile 配置的项目目录
3. 调用 `codex exec resume`
4. 把最终回复再发回飞书

## 当前设计

- 飞书侧：推荐使用 **企业自建应用 + 机器人能力 + 事件订阅**
- 本地侧：运行一个 Node HTTP 服务
- 对外暴露：推荐走你自己的 tunnel，例如 Cloudflare Tunnel 或 Tailscale Funnel

这版默认假设：

- 飞书事件回调使用明文 JSON
- 事件校验采用 verification token
- 机器人接收文本消息事件 `im.message.receive_v1`

如果你后面在飞书后台打开了更严格的加密回调，可以再补解密逻辑。

更详细的中文操作记录见：

- [docs/FEISHU_CLOUDFLARE_SETUP_ZH.md](/Users/yangwenwei/Desktop/codex-project/my-app/guanceyun-paas/docs/FEISHU_CLOUDFLARE_SETUP_ZH.md)

## 本地要求

- Node.js 22+
- 本机安装 `codex` CLI
- 你已经有至少一个可恢复的 Codex session

## 启动

1. 复制配置文件：

```bash
cp bridge.config.json.example bridge.config.json
```

也可以临时指定别的配置文件：

```bash
BRIDGE_CONFIG_PATH=/absolute/path/to/bridge.config.json npm run start
```

2. 按你的本机信息修改 `bridge.config.json`

关键配置：

- `feishu.appId`
- `feishu.appSecret`
- `feishu.verificationToken`
- `profiles.default.cwd`
- `profiles.default.sessionId`

3. 本地检查：

```bash
npm run check
npm run smoke
```

4. 启动服务：

```bash
npm run start
```

如果本机已经安装了 `cloudflared`，也可以直接一起起 quick tunnel：

```bash
zsh ./scripts/start-quick-tunnel.sh
```

它会：

1. 启动本地 bridge
2. 打开一个 `trycloudflare.com` 临时公网地址
3. 你把这个地址后面拼上 `/feishu/events`，填到飞书事件回调里

如果你已经完成了 Cloudflare 登录、命名 tunnel 创建和 DNS 绑定，也可以直接起固定 tunnel：

```bash
zsh ./scripts/start-fixed-tunnel.sh
```

当前已验证的固定地址：

```text
https://guance-codex.360timesai.com
```

飞书回调地址可改成：

```text
https://guance-codex.360timesai.com/feishu/events
```

如果你希望 Mac 重启后也自动恢复 bridge 和固定 Tunnel，可以安装 `launchd` 开机自启：

```bash
zsh ./scripts/install-launchd.sh
```

默认监听：

```text
http://127.0.0.1:4319
```

健康检查：

```bash
curl http://127.0.0.1:4319/health
```

## 飞书侧配置建议

在飞书开放平台创建 **企业自建应用**，然后：

1. 开启机器人能力
2. 订阅消息接收事件
3. 把事件回调地址指向：

```text
https://your-public-domain.example.com/feishu/events
```

4. 在应用权限里保证机器人具备发送消息能力
5. 把应用发布到你自己可用的范围内

## 命令格式

默认命令前缀：

```text
/codex
```

可用形式：

```text
/codex help
/codex profiles
/codex default 只分析，不要改代码
/codex guance 修一下登录报错并跑测试
```

如果第一段命令命中了 profile 名称，就会使用对应 profile。
否则会使用 `defaultProfile`。

## Manual Send

除了飞书回调，还支持本地手工调用：

```bash
curl -X POST http://127.0.0.1:4319/bridge/send \
  -H 'content-type: application/json' \
  -H 'x-bridge-secret: change-this-local-secret' \
  -d '{"profile":"default","message":"帮我总结一下当前目录该做什么"}'
```

这个接口适合先在本机把 Codex 执行链路试通。

## 安全建议

这版已经做了三层最基础限制：

- 只处理带 `/codex` 前缀的消息
- 可以配置允许的飞书用户 ID 白名单
- 本地 manual send 可以要求共享密钥

仍然建议你继续加这些约束：

- 先只给自己开可用范围
- 先只给一个测试群
- profile 只配置你愿意让它操作的目录
- `allowDangerouslyBypassApprovals` 初始先保持 `false`

## 当前联通状态

这版已经验证过：

- 飞书单聊命令可达本地 bridge
- 飞书消息可以进入 Codex 执行队列
- Cloudflare quick tunnel 可用
- 本机到 GitHub 的 SSH 认证已打通

当前也已经验证：

- `360timesai.com` 已在 Cloudflare 生效
- 固定子域名 `guance-codex.360timesai.com` 可访问本地 bridge

## 上传到 GitHub

代码上传时建议：

1. 本地配置放在 `bridge.config.json`
2. 提交仓库时只提交 `bridge.config.json.example`
3. 保持 `bridge.config.json` 留在 `.gitignore`
4. 远端仓库创建后，再把本地仓库 push 上去

推荐仓库名示例：

- `guance-feishu-codex-bridge`
