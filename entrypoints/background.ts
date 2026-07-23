import { clearSession, getSession, loginDemo } from "../lib/auth";
import { runAutomation } from "../lib/saas-api";
import type {
  ExtensionMessage,
  ExtensionResponse,
} from "../lib/types";

/**
 * Background service worker — auth, long-lived state, SaaS API calls.
 * Content scripts never talk to the backend directly; they message here.
 */
export default defineBackground(() => {
  console.log("[Enterprise Companion] service worker ready");

  browser.runtime.onMessage.addListener(
    (
      message: ExtensionMessage,
      _sender,
      sendResponse: (response: ExtensionResponse) => void,
    ) => {
      void (async () => {
        try {
          switch (message.type) {
            case "PING":
              sendResponse({ type: "PONG" });
              break;

            case "GET_AUTH": {
              const session = await getSession();
              sendResponse({ type: "AUTH_STATE", session });
              break;
            }

            case "LOGIN": {
              // Demo auth. Production: chrome.identity.launchWebAuthFlow → your SaaS.
              const session = await loginDemo(message.email);
              sendResponse({ type: "AUTH_STATE", session });
              break;
            }

            case "LOGOUT": {
              await clearSession();
              sendResponse({ type: "AUTH_STATE", session: null });
              break;
            }

            case "RUN_AUTOMATION": {
              const session = await getSession();
              if (!session) {
                sendResponse({
                  type: "ERROR",
                  message: "Not signed in. Connect your SaaS account first.",
                });
                break;
              }
              const result = await runAutomation(session, message.payload);
              sendResponse({ type: "AUTOMATION_RESULT", result });
              break;
            }

            default:
              sendResponse({
                type: "ERROR",
                message: "Unknown message type",
              });
          }
        } catch (err) {
          sendResponse({
            type: "ERROR",
            message: err instanceof Error ? err.message : String(err),
          });
        }
      })();

      // Keep the message channel open for async sendResponse
      return true;
    },
  );
});
