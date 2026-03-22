# 飞书 + Cloudflare Tunnel 接入说明

本文记录当前这套 `feishu-codex-bridge` 的接入过程，方便后续迁移、复用和固定域名上线。

## 一、整体链路

```text
飞书消息
  -> 飞书事件订阅
  -> Cloudflare Tunnel
  -> 本机 bridge 服务
  -> Codex CLI
  -> 结果回发飞书
```

## 二、飞书侧配置

### 1. 创建应用

- 创建企业自建应用
- 开启机器人能力

### 2. 回调配置

在 `事件与回调 -> 回调配置` 中：

- 订阅方式：`将回调发送至 开发者服务器`
- 请求地址：`https://<your-host>/feishu/events`

### 3. 事件配置

在 `事件与回调 -> 事件配置` 中：

- 订阅方式：`将事件发送至 开发者服务器`
- 请求地址：`https://<your-host>/feishu/events`

已验证核心事件：

- `接收消息 v2.0`
- 事件名：`im.message.receive_v1`

### 4. 权限建议

最小推荐权限：

- `im:message:send_as_bot`
- `im:message.group_at_msg:readonly`
- `im:message.p2p_msg:readonly`

### 5. 生效方式

飞书后台修改完：

- 创建版本
- 发布应用

否则事件和权限不会生效。

## 三、本机 bridge 配置

配置文件：

- `bridge.config.json`

关键字段：

- `feishu.appId`
- `feishu.appSecret`
- `feishu.verificationToken`
- `security.allowedUserIds`
- `profiles`

当前命令示例：

```text
/codex help
/codex guance 看一下当前工程结构，列出关键文件，不要改代码
```

## 四、临时 Cloudflare Tunnel

当前已经验证过的临时 quick tunnel 方式：

```bash
cd /Users/yangwenwei/Desktop/codex-project/my-app/guanceyun-paas
npm run start
/opt/homebrew/bin/cloudflared tunnel --url http://127.0.0.1:4319 --no-autoupdate
```

`trycloudflare.com` 地址适合临时测试，不适合长期稳定使用。断开或重启后地址会变化。

## 五、固定 Cloudflare 域名上线

### 1. 域名接入 Cloudflare

域名：

- `360timesai.com`

Cloudflare 分配的 nameserver：

- `carol.ns.cloudflare.com`
- `skip.ns.cloudflare.com`

域名注册商原 nameserver：

- `ns09.domaincontrol.com`
- `ns10.domaincontrol.com`

需要在注册商侧替换成 Cloudflare 的 nameserver，并等待 Cloudflare 状态从 `Pending` 变为 `Active`。

### 2. 域名激活后要做的事

域名激活完成后，继续执行：

```bash
cloudflared tunnel login
cloudflared tunnel create guance-feishu-codex
cloudflared tunnel route dns guance-feishu-codex guance-codex.360timesai.com
cloudflared tunnel --no-autoupdate run --url http://127.0.0.1:4319 guance-feishu-codex
```

当前已实际绑定的固定子域名：

- `guance-codex.360timesai.com`

飞书回调地址改为：

```text
https://guance-codex.360timesai.com/feishu/events
```

健康检查地址：

```text
https://guance-codex.360timesai.com/health
```

## 六、已验证通过的功能

- 飞书单聊 `/codex help`
- 飞书单聊真实命令进入队列
- 群聊 `@机器人` 前缀兼容
- 白名单校验
- Cloudflare quick tunnel 联通
- Cloudflare 固定域名 `guance-codex.360timesai.com` 联通
- GitHub SSH 认证联通

## 七、建议的后续项

- 固定 Cloudflare Tunnel
- 为高风险命令增加确认机制
- GitHub 远端仓库创建与自动 push
