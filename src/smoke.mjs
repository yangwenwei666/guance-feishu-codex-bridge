import { loadConfig } from "./config.mjs";
import { parseBridgeCommand } from "./command-router.mjs";
import { normalizeFeishuEvent } from "./feishu-events.mjs";

const loadedConfig = await loadConfig();
const config = Object.keys(loadedConfig.profiles).length
  ? loadedConfig
  : {
      ...loadedConfig,
      defaultProfile: "default",
      profiles: {
        default: {
          name: "default",
          label: "Default Workspace",
          cwd: process.cwd(),
          sessionId: "demo-session",
          instructions: "Demo instructions"
        }
      }
    };

const sampleEvent = {
  schema: "2.0",
  header: {
    event_id: "test-event-id",
    event_type: "im.message.receive_v1",
    token: config.feishu.verificationToken || "token"
  },
  event: {
    sender: {
      sender_id: {
        open_id: "ou_test_user"
      },
      sender_type: "user"
    },
    message: {
      message_id: "om_test",
      chat_id: "oc_test_chat",
      chat_type: "group",
      message_type: "text",
      content: JSON.stringify({
        text: `${config.commandPrefix} ${config.defaultProfile} 帮我检查一下当前工程状态`
      })
    }
  }
};

const normalized = normalizeFeishuEvent(sampleEvent);
const command = parseBridgeCommand(normalized.text, config);

console.log(
  JSON.stringify(
    {
      normalized,
      command
    },
    null,
    2
  )
);
