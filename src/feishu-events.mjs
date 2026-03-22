import { safeJsonParse } from "./utils.mjs";

function coerceTextContent(content) {
  if (!content) {
    return "";
  }
  if (typeof content === "object" && typeof content.text === "string") {
    return content.text.trim();
  }
  if (typeof content !== "string") {
    return "";
  }
  const parsed = safeJsonParse(content, null);
  if (parsed && typeof parsed.text === "string") {
    return parsed.text.trim();
  }
  return content.trim();
}

export function normalizeFeishuEvent(payload) {
  if (payload?.challenge) {
    return {
      kind: "challenge",
      challenge: payload.challenge
    };
  }

  const header = payload?.header ?? {};
  const event = payload?.event ?? {};
  const message = event.message ?? {};
  const sender = event.sender ?? {};
  const senderId = sender.sender_id ?? {};

  return {
    kind: "event",
    eventId: header.event_id ?? payload?.uuid ?? message.message_id ?? "",
    eventType: header.event_type ?? payload?.type ?? "",
    token: header.token ?? payload?.token ?? "",
    messageId: message.message_id ?? "",
    messageType: message.message_type ?? "",
    chatId: message.chat_id ?? "",
    chatType: message.chat_type ?? "",
    text: coerceTextContent(message.content),
    senderType: sender.sender_type ?? "",
    senderOpenId: senderId.open_id ?? "",
    senderUserId: senderId.user_id ?? "",
    isMention: Array.isArray(event.mentions) ? event.mentions.length > 0 : false
  };
}

export function isSupportedMessageEvent(normalized) {
  return normalized.kind === "event" && normalized.eventType === "im.message.receive_v1";
}

export function resolveSenderIdentity(normalized) {
  return normalized.senderOpenId || normalized.senderUserId || "";
}
