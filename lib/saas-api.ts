import type {
  AutomationRequest,
  AutomationResult,
  AuthSession,
} from "./types";

/**
 * SaaS API client — points at your existing backend.
 * Set VITE_SAAS_API_URL in .env for a real endpoint; otherwise uses a local mock loop.
 */
const API_BASE =
  import.meta.env.VITE_SAAS_API_URL?.replace(/\/$/, "") || null;

async function callBackend(
  path: string,
  session: AuthSession,
  body: unknown,
): Promise<AutomationResult> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return {
      ok: false,
      action: (body as AutomationRequest).action,
      summary: "Backend request failed",
      error: text,
    };
  }

  return (await res.json()) as AutomationResult;
}

/** Mock automation loop when no SaaS URL is configured */
function mockAutomation(req: AutomationRequest): AutomationResult {
  const { name, company, email, title } = req.context.fields;
  const who = name || email || "this prospect";

  switch (req.action) {
    case "enrich":
      return {
        ok: true,
        action: "enrich",
        summary: `Enriched ${who}${company ? ` @ ${company}` : ""}`,
        data: {
          seniority: "Director+",
          intentScore: 78,
          techStack: ["Salesforce", "Outreach", "Gong"],
          linkedIn: req.context.fields.profileUrl,
        },
      };
    case "sync_crm":
      return {
        ok: true,
        action: "sync_crm",
        summary: `Synced ${who} into your SaaS CRM (no host-dashboard migration)`,
        data: {
          recordId: `saas_${req.context.fields.recordId || crypto.randomUUID().slice(0, 8)}`,
          platform: req.context.platform,
        },
      };
    case "draft_outreach":
      return {
        ok: true,
        action: "draft_outreach",
        summary: `Draft ready for ${who}`,
        data: {
          subject: company
            ? `Quick idea for ${company}'s pipeline`
            : "Worth a 15-minute chat?",
          body: `Hi ${name?.split(" ")[0] || "there"},\n\nNoticed ${title ? `your role as ${title}` : "your work"} and thought our companion workflow could sit inside tools your team already uses — no new dashboard to learn.\n\nOpen to a brief walkthrough?`,
        },
      };
    case "log_activity":
      return {
        ok: true,
        action: "log_activity",
        summary: `Logged activity on ${who}${req.notes ? `: ${req.notes}` : ""}`,
        data: { loggedAt: new Date().toISOString() },
      };
    default:
      return {
        ok: false,
        action: req.action,
        summary: "Unknown action",
        error: `Unsupported action: ${req.action}`,
      };
  }
}

/**
 * Triggers the automation loop on your SaaS backend, then returns
 * the processed result for the extension UI (real-time companion pattern).
 */
export async function runAutomation(
  session: AuthSession,
  request: AutomationRequest,
): Promise<AutomationResult> {
  if (API_BASE) {
    return callBackend("/api/extension/automate", session, request);
  }
  // Simulate network latency of a real automation worker
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
  return mockAutomation(request);
}
