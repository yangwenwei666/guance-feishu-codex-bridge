export class FeishuTenantAccessTokenClient {
  #appId;
  #appSecret;
  #token = "";
  #expiresAt = 0;

  constructor({ appId, appSecret }) {
    this.#appId = appId;
    this.#appSecret = appSecret;
  }

  async getToken() {
    const now = Date.now();
    if (this.#token && now < this.#expiresAt - 60_000) {
      return this.#token;
    }

    const response = await fetch(
      "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal/",
      {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
          app_id: this.#appId,
          app_secret: this.#appSecret
        })
      }
    );

    const payload = await response.json();
    if (!response.ok || payload.code !== 0 || !payload.tenant_access_token) {
      throw new Error(
        `Failed to fetch Feishu tenant_access_token: ${response.status} ${JSON.stringify(payload)}`
      );
    }

    this.#token = payload.tenant_access_token;
    this.#expiresAt = now + Number(payload.expire ?? 7200) * 1000;
    return this.#token;
  }
}
