import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function expandHome(targetPath) {
  if (!targetPath) {
    return targetPath;
  }
  if (targetPath === "~") {
    return os.homedir();
  }
  if (targetPath.startsWith("~/")) {
    return path.join(os.homedir(), targetPath.slice(2));
  }
  return targetPath;
}

export async function readJsonFile(filePath, fallback = {}) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export function redactSecret(value, visible = 4) {
  if (!value) {
    return "";
  }
  if (value.length <= visible * 2) {
    return "*".repeat(value.length);
  }
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

export function chunkText(text, maxLength = 3500) {
  const normalized = String(text ?? "").trim();
  if (!normalized) {
    return [];
  }
  if (normalized.length <= maxLength) {
    return [normalized];
  }

  const chunks = [];
  let remaining = normalized;
  while (remaining.length > maxLength) {
    let index = remaining.lastIndexOf("\n", maxLength);
    if (index < maxLength / 2) {
      index = remaining.lastIndexOf(" ", maxLength);
    }
    if (index < maxLength / 2) {
      index = maxLength;
    }
    chunks.push(remaining.slice(0, index).trim());
    remaining = remaining.slice(index).trim();
  }
  if (remaining) {
    chunks.push(remaining);
  }
  return chunks;
}

export function createShortId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function safeJsonParse(raw, fallback = null) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
