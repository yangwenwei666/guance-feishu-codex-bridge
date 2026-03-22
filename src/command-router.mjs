function listProfiles(config) {
  return Object.values(config.profiles)
    .map((profile) => `${profile.name}: ${profile.label}`)
    .join("\n");
}

export function parseBridgeCommand(text, config) {
  const raw = String(text ?? "")
    .replace(/^(\s*@[_a-zA-Z0-9-]+\s*)+/, "")
    .trim();
  if (!raw.startsWith(config.commandPrefix)) {
    return { handled: false };
  }

  const remainder = raw.slice(config.commandPrefix.length).trim();
  if (!remainder || remainder === "help") {
    return {
      handled: true,
      builtinReply: [
        `用法: ${config.commandPrefix} [profile] <命令>`,
        "",
        "示例:",
        `${config.commandPrefix} guance 看一下最近的登录报错`,
        `${config.commandPrefix} default 只分析，不要改代码`,
        "",
        "可用 profile:",
        listProfiles(config)
      ].join("\n")
    };
  }

  if (remainder === "profiles") {
    return {
      handled: true,
      builtinReply: `可用 profile:\n${listProfiles(config)}`
    };
  }

  const [firstToken, ...restTokens] = remainder.split(/\s+/);
  const explicitProfile = config.profiles[firstToken] ? firstToken : null;
  const profileName = explicitProfile ?? config.defaultProfile;
  const prompt = explicitProfile ? restTokens.join(" ").trim() : remainder;

  if (!prompt) {
    return {
      handled: true,
      builtinReply: `请在 ${config.commandPrefix} 后面跟要执行的命令。`
    };
  }

  return {
    handled: true,
    profileName,
    prompt
  };
}
