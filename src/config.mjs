import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expandHome, readJsonFile } from "./utils.mjs";

function resolveProfile(name, profile) {
  return {
    name,
    label: profile.label ?? name,
    cwd: expandHome(profile.cwd),
    sessionId: profile.sessionId ?? null,
    instructions: profile.instructions ?? ""
  };
}

export async function loadConfig() {
  const rootDir = fileURLToPath(new URL("../", import.meta.url));
  const configPath = expandHome(
    process.env.BRIDGE_CONFIG_PATH ?? path.join(rootDir, "bridge.config.json")
  );
  const userConfig = await readJsonFile(configPath, {});

  const feishu = {
    appId: process.env.FEISHU_APP_ID ?? userConfig.feishu?.appId ?? "",
    appSecret: process.env.FEISHU_APP_SECRET ?? userConfig.feishu?.appSecret ?? "",
    verificationToken:
      process.env.FEISHU_VERIFICATION_TOKEN ?? userConfig.feishu?.verificationToken ?? ""
  };

  const profilesSource = userConfig.profiles ?? {};
  const profiles = {};
  for (const [name, profile] of Object.entries(profilesSource)) {
    profiles[name] = resolveProfile(name, profile);
  }

  return {
    rootDir,
    configPath,
    host: userConfig.host ?? process.env.PORT_HOST ?? "127.0.0.1",
    port: Number(userConfig.port ?? process.env.PORT ?? 4319),
    publicBaseUrl: userConfig.publicBaseUrl ?? process.env.PUBLIC_BASE_URL ?? "",
    commandPrefix: userConfig.commandPrefix ?? process.env.COMMAND_PREFIX ?? "/codex",
    sharedSecret: process.env.BRIDGE_SHARED_SECRET ?? userConfig.sharedSecret ?? "",
    feishu,
    codex: {
      codexHome: expandHome(
        process.env.CODEX_HOME_OVERRIDE ??
          userConfig.codex?.codexHome ??
          path.join(os.homedir(), ".codex")
      ),
      allowDangerouslyBypassApprovals:
        process.env.CODEX_ALLOW_DANGEROUS != null
          ? process.env.CODEX_ALLOW_DANGEROUS === "1"
          : Boolean(userConfig.codex?.allowDangerouslyBypassApprovals),
      replyLanguage: userConfig.codex?.replyLanguage ?? "zh-CN"
    },
    security: {
      allowedUserIds: Array.isArray(userConfig.security?.allowedUserIds)
        ? userConfig.security.allowedUserIds.map(String)
        : [],
      requireSharedSecretForManualSend: Boolean(
        userConfig.security?.requireSharedSecretForManualSend ?? true
      )
    },
    defaultProfile: userConfig.defaultProfile ?? "default",
    profiles
  };
}

export function validateConfig(config) {
  const errors = [];
  if (!config.feishu.appId) {
    errors.push("Missing feishu.appId");
  }
  if (!config.feishu.appSecret) {
    errors.push("Missing feishu.appSecret");
  }
  if (!config.feishu.verificationToken) {
    errors.push("Missing feishu.verificationToken");
  }
  if (!Object.keys(config.profiles).length) {
    errors.push("At least one profile is required in bridge.config.json");
  }
  if (!config.profiles[config.defaultProfile]) {
    errors.push(`defaultProfile "${config.defaultProfile}" does not exist`);
  }
  for (const profile of Object.values(config.profiles)) {
    if (!profile.cwd) {
      errors.push(`Profile "${profile.name}" is missing cwd`);
    }
  }
  return errors;
}
