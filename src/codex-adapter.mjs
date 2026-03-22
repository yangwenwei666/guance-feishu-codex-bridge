import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { ensureDir } from "./utils.mjs";

function onceExit(child) {
  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}

function buildPrompt({ profile, bridgePrompt, replyLanguage }) {
  const sections = [
    "You are being invoked by a local Feishu bridge on the user's Mac.",
    `Reply language preference: ${replyLanguage}.`,
    "Keep the final answer concise and action-oriented unless the user asks for depth.",
    `Workspace profile: ${profile.name} (${profile.label}).`,
    `Working directory: ${profile.cwd}`
  ];

  if (profile.instructions) {
    sections.push(`Profile instructions:\n${profile.instructions}`);
  }

  sections.push(`User request from Feishu:\n${bridgePrompt}`);
  return sections.join("\n\n");
}

export async function runCodexForProfile({ config, profile, prompt }) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "feishu-codex-bridge-"));
  const outputPath = path.join(tmpDir, "last-message.txt");
  await ensureDir(profile.cwd);

  const args = ["exec", "resume", "--skip-git-repo-check", "-o", outputPath];
  if (config.codex.allowDangerouslyBypassApprovals) {
    args.push("--dangerously-bypass-approvals-and-sandbox");
  } else {
    args.push("--full-auto");
  }

  if (profile.sessionId) {
    args.push(profile.sessionId);
  } else {
    args.push("--last");
  }

  args.push(
    buildPrompt({
      profile,
      bridgePrompt: prompt,
      replyLanguage: config.codex.replyLanguage
    })
  );

  const child = spawn("codex", args, {
    cwd: profile.cwd,
    env: {
      ...process.env,
      CODEX_HOME: config.codex.codexHome
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const startedAt = Date.now();
  const exitCode = await onceExit(child);

  let reply = "";
  try {
    reply = (await fs.readFile(outputPath, "utf8")).trim();
  } catch {
    reply = "";
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  if (!reply) {
    reply = [
      "Codex 没有产出可回传的最终消息。",
      `exitCode=${exitCode}`,
      stderr ? `stderr:\n${stderr.trim()}` : "",
      stdout ? `stdout:\n${stdout.trim()}` : ""
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return {
    exitCode,
    reply,
    stdout,
    stderr,
    elapsedMs: Date.now() - startedAt
  };
}
