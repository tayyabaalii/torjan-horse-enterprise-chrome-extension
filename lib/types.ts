/** Shared message protocol between content scripts, popup, and background. */

export type HostPlatform = "salesforce" | "linkedin" | "hubspot" | "unknown";

export interface PageContext {
  platform: HostPlatform;
  url: string;
  title?: string;
  /** Extracted lead / prospect fields from the host DOM */
  fields: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
    recordId?: string;
    profileUrl?: string;
  };
  extractedAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export type AutomationAction =
  | "enrich"
  | "sync_crm"
  | "draft_outreach"
  | "log_activity";

export interface AutomationRequest {
  action: AutomationAction;
  context: PageContext;
  notes?: string;
}

export interface AutomationResult {
  ok: boolean;
  action: AutomationAction;
  summary: string;
  data?: Record<string, unknown>;
  error?: string;
}

/** Message envelope for chrome.runtime.sendMessage */
export type ExtensionMessage =
  | { type: "GET_AUTH" }
  | { type: "LOGIN"; email?: string }
  | { type: "LOGOUT" }
  | { type: "RUN_AUTOMATION"; payload: AutomationRequest }
  | { type: "PING" };

export type ExtensionResponse =
  | { type: "AUTH_STATE"; session: AuthSession | null }
  | { type: "AUTOMATION_RESULT"; result: AutomationResult }
  | { type: "ERROR"; message: string }
  | { type: "PONG" };
