import http from "node:http";
import { loadConfig, validateConfig } from "./config.mjs";
import { parseBridgeCommand } from "./command-router.mjs";
import { runCodexForProfile } from "./codex-adapter.mjs";
import { normalizeFeishuEvent, isSupportedMessageEvent, resolveSenderIdentity } from "./feishu-events.mjs";
import { FeishuTenantAccessTokenClient } from "./feishu-auth.mjs";
import { FeishuMessagingClient } from "./feishu-api.mjs";
import { SerialTaskQueue } from "./queue.mjs";

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload, null, 2));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

function isUserAllowed(config, senderIdentity) {
  const allowList = config.security.allowedUserIds;
  if (!allowList.length) {
    return true;
  }
  return allowList.includes(senderIdentity);
}

async function main() {
  const config = await loadConfig();
  const errors = validateConfig(config);
  if (errors.length) {
    throw new Error(`Invalid config:\n- ${errors.join("\n- ")}`);
  }

  const queue = new SerialTaskQueue();
  const seenEvents = new Map();
  const tokenClient = new FeishuTenantAccessTokenClient({
    appId: config.feishu.appId,
    appSecret: config.feishu.appSecret
  });
  const messagingClient = new FeishuMessagingClient({ tokenClient });

  function log(message, details) {
    if (details === undefined) {
      console.log(`[bridge] ${message}`);
      return;
    }
    console.log(
      `[bridge] ${message} ${typeof details === "string" ? details : JSON.stringify(details)}`
    );
  }

  async function safeSendMessage(receiveId, text, context = "send") {
    try {
      await messagingClient.sendTextMessage({
        receiveId,
        text
      });
      log("feishu_reply_sent", { context, receiveId });
    } catch (error) {
      log("feishu_reply_failed", {
        context,
        receiveId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  function rememberEvent(eventId) {
    if (!eventId) {
      return false;
    }
    const now = Date.now();
    for (const [key, createdAt] of seenEvents.entries()) {
      if (now - createdAt > 30 * 60_000) {
        seenEvents.delete(key);
      }
    }
    if (seenEvents.has(eventId)) {
      return true;
    }
    seenEvents.set(eventId, now);
    return false;
  }

  async function handleCommand({ source, receiveId, command, senderIdentity }) {
    if (command.builtinReply) {
      await safeSendMessage(receiveId, command.builtinReply, "builtin_reply");
      return;
    }

    const profile = config.profiles[command.profileName];
    if (!profile) {
      await messagingClient.sendTextMessage({
        receiveId,
        text: `未知 profile: ${command.profileName}`
      });
      return;
    }

    const { position, promise } = queue.enqueue(async () => {
      await safeSendMessage(
        receiveId,
        [
          `开始执行 ${profile.name}。`,
          `发送人: ${senderIdentity || "unknown"}`,
          `来源: ${source}`,
          "",
          `命令: ${command.prompt}`
        ].join("\n"),
        "job_started"
      );

      const result = await runCodexForProfile({
        config,
        profile,
        prompt: command.prompt
      });

      const summary = [
        `执行完成，耗时 ${(result.elapsedMs / 1000).toFixed(1)}s。`,
        `exitCode=${result.exitCode}`,
        "",
        result.reply
      ].join("\n");

      await safeSendMessage(receiveId, summary, "job_finished");
    });

    const queuedText =
      position > 1
        ? `已加入队列，前面还有 ${position - 1} 个任务。`
        : "已接收，准备开始执行。";

    await safeSendMessage(receiveId, queuedText, "job_queued");

    promise.catch(async (error) => {
      const message = error instanceof Error ? error.message : String(error);
      try {
        await safeSendMessage(receiveId, `执行失败:\n${message}`, "job_failed");
      } catch {
        console.error("[bridge] failed to send Feishu error reply:", message);
      }
    });
  }

  const server = http.createServer(async (request, response) => {
    try {
      log("http_request", {
        method: request.method,
        url: request.url
      });

      if (request.method === "GET" && request.url === "/health") {
        sendJson(response, 200, {
          ok: true,
          service: "feishu-codex-bridge",
          queuePending: queue.pending,
          defaultProfile: config.defaultProfile
        });
        return;
      }

      if (request.method === "POST" && request.url === "/bridge/send") {
        const body = await readJsonBody(request);
        log("manual_send", {
          profile: body.profile ?? null
        });
        if (config.security.requireSharedSecretForManualSend) {
          const suppliedSecret = request.headers["x-bridge-secret"];
          if (!config.sharedSecret || suppliedSecret !== config.sharedSecret) {
            sendJson(response, 401, {
              ok: false,
              error: "invalid bridge secret"
            });
            return;
          }
        }

        const command = parseBridgeCommand(
          body.message?.startsWith(config.commandPrefix)
            ? body.message
            : `${config.commandPrefix} ${body.profile ?? config.defaultProfile} ${body.message ?? ""}`,
          config
        );

        if (!command.handled || command.builtinReply) {
          sendJson(response, 400, {
            ok: false,
            error: "manual send requires a runnable command"
          });
          return;
        }

        const profile = config.profiles[command.profileName];
        const result = await runCodexForProfile({
          config,
          profile,
          prompt: command.prompt
        });

        sendJson(response, 200, {
          ok: true,
          profile: profile.name,
          exitCode: result.exitCode,
          elapsedMs: result.elapsedMs,
          reply: result.reply
        });
        return;
      }

      if (request.method === "POST" && request.url === "/feishu/events") {
        const body = await readJsonBody(request);
        const normalized = normalizeFeishuEvent(body);
        log("feishu_event_received", normalized);

        if (normalized.kind === "challenge") {
          log("feishu_event_challenge", normalized.challenge);
          sendJson(response, 200, { challenge: normalized.challenge });
          return;
        }

        if (normalized.token !== config.feishu.verificationToken) {
          log("feishu_event_rejected", "verification token mismatch");
          sendJson(response, 401, {
            ok: false,
            error: "verification token mismatch"
          });
          return;
        }

        if (!isSupportedMessageEvent(normalized)) {
          log("feishu_event_ignored", normalized.eventType || "unknown");
          sendJson(response, 200, { ok: true, ignored: normalized.eventType || "unknown" });
          return;
        }

        if (rememberEvent(normalized.eventId)) {
          log("feishu_event_deduplicated", normalized.eventId);
          sendJson(response, 200, { ok: true, deduplicated: true });
          return;
        }

        if (normalized.senderType && normalized.senderType !== "user") {
          log("feishu_event_ignored", "non-user sender");
          sendJson(response, 200, { ok: true, ignored: "non-user sender" });
          return;
        }

        const senderIdentity = resolveSenderIdentity(normalized);
        if (!isUserAllowed(config, senderIdentity)) {
          log("feishu_event_ignored", `user not allowed: ${senderIdentity}`);
          sendJson(response, 200, { ok: true, ignored: "user not allowed" });
          return;
        }

        const command = parseBridgeCommand(normalized.text, config);
        if (!command.handled) {
          log("feishu_event_ignored", "message without prefix");
          sendJson(response, 200, { ok: true, ignored: "message without prefix" });
          return;
        }

        log("feishu_command_accepted", {
          senderIdentity,
          chatId: normalized.chatId,
          profileName: command.profileName ?? null,
          prompt: command.prompt ?? null,
          builtin: Boolean(command.builtinReply)
        });

        void handleCommand({
          source: "feishu",
          receiveId: normalized.chatId,
          command,
          senderIdentity
        });

        sendJson(response, 200, { ok: true });
        return;
      }

      sendJson(response, 404, {
        ok: false,
        error: "not found"
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  server.listen(config.port, config.host, () => {
    console.log(
      JSON.stringify(
        {
          ok: true,
          host: config.host,
          port: config.port,
          commandPrefix: config.commandPrefix,
          defaultProfile: config.defaultProfile,
          profiles: Object.keys(config.profiles)
        },
        null,
        2
      )
    );
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
