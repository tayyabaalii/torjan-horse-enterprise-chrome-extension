import type {
  ExtensionMessage,
  ExtensionResponse,
} from "./types";

/** Typed wrapper around chrome.runtime.sendMessage */
export function sendToBackground<T extends ExtensionResponse>(
  message: ExtensionMessage,
): Promise<T> {
  return browser.runtime.sendMessage(message) as Promise<T>;
}
