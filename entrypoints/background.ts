import {
  clearSession,
  getSession,
  loginWithPassword,
  signUpWithPassword,
} from "../lib/auth";
import { runAutomation } from "../lib/saas-api";
import type {
  ExtensionMessage,
  ExtensionResponse,
} from "../lib/types";

/**
 * Background service worker — auth, long-lived state, SaaS / Supabase CRM calls.
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
              const session = await loginWithPassword(
                message.email,
                message.password,
              );
              sendResponse({ type: "AUTH_STATE", session });
              break;
            }

            case "SIGNUP": {
              const session = await signUpWithPassword(
                message.email,
                message.password,
              );
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
                  message: "Not signed in. Connect your CRM account first.",
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

      return true;
    },
  );
});
