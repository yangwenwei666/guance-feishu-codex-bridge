import { chunkText, createShortId } from "./utils.mjs";

async function postJson(url, body, token) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json();
  if (!response.ok || payload.code !== 0) {
    throw new Error(`Feishu API failed: ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload;
}

export class FeishuMessagingClient {
  #tokenClient;

  constructor({ tokenClient }) {
    this.#tokenClient = tokenClient;
  }

  async sendTextMessage({ receiveIdType = "chat_id", receiveId, text }) {
    const token = await this.#tokenClient.getToken();
    const url = new URL("https://open.feishu.cn/open-apis/im/v1/messages");
    url.searchParams.set("receive_id_type", receiveIdType);

    const chunks = chunkText(text);
    for (const chunk of chunks) {
      await postJson(
        url.toString(),
        {
          receive_id: receiveId,
          msg_type: "text",
          content: JSON.stringify({ text: chunk }),
          uuid: createShortId()
        },
        token
      );
    }
  }
}
