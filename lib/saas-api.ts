import type {
  AutomationRequest,
  AutomationResult,
  AuthSession,
  PageContext,
} from "./types";
import { createAuthedClient, isSupabaseConfigured } from "./supabase";

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

function leadKey(context: PageContext): string | null {
  if (context.fields.profileUrl) return context.fields.profileUrl.split("?")[0];
  if (context.platform === "linkedin") return context.url.split("?")[0];
  if (context.fields.recordId) {
    return `${context.platform}:${context.fields.recordId}`;
  }
  if (context.fields.email) return `email:${context.fields.email.toLowerCase()}`;
  return null;
}

async function syncLeadToCrm(
  session: AuthSession,
  req: AutomationRequest,
): Promise<AutomationResult> {
  const supabase = createAuthedClient(session);
  const { context } = req;
  const who = context.fields.name || context.fields.email || "this prospect";
  const linkedinUrl =
    context.platform === "linkedin"
      ? leadKey(context)
      : context.fields.profileUrl || null;
  const key = leadKey(context);

  if (!key) {
    return {
      ok: false,
      action: "sync_crm",
      summary: "Could not identify this person",
      error: "Missing LinkedIn URL / email / record id to upsert",
    };
  }

  const row = {
    owner_id: session.user.id,
    name: context.fields.name || null,
    title: context.fields.title || null,
    company: context.fields.company || null,
    email: context.fields.email || null,
    phone: context.fields.phone || null,
    linkedin_url: linkedinUrl,
    source: context.platform === "unknown" ? "extension" : context.platform,
    platform: context.platform,
    external_record_id: context.fields.recordId || null,
    raw_context: context as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  };

  // Find existing by LinkedIn URL (preferred) or external id
  let existingId: string | null = null;
  if (linkedinUrl) {
    const { data } = await supabase
      .from("leads")
      .select("id")
      .eq("linkedin_url", linkedinUrl)
      .maybeSingle();
    existingId = data?.id ?? null;
  }

  if (existingId) {
    const { data, error } = await supabase
      .from("leads")
      .update(row)
      .eq("id", existingId)
      .select("id, name, status, linkedin_url")
      .single();

    if (error) {
      return {
        ok: false,
        action: "sync_crm",
        summary: "CRM update failed",
        error: error.message,
      };
    }

    return {
      ok: true,
      action: "sync_crm",
      summary: `Updated ${who} in your CRM`,
      data: { recordId: data.id, status: data.status, linkedin_url: data.linkedin_url },
    };
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({ ...row, status: "new" })
    .select("id, name, status, linkedin_url")
    .single();

  if (error) {
    return {
      ok: false,
      action: "sync_crm",
      summary: "CRM insert failed",
      error: error.message,
    };
  }

  return {
    ok: true,
    action: "sync_crm",
    summary: `Saved ${who} to your CRM`,
    data: { recordId: data.id, status: data.status, linkedin_url: data.linkedin_url },
  };
}

async function logActivityToCrm(
  session: AuthSession,
  req: AutomationRequest,
): Promise<AutomationResult> {
  const supabase = createAuthedClient(session);
  const linkedinUrl =
    req.context.platform === "linkedin" ? leadKey(req.context) : null;
  const who = req.context.fields.name || "prospect";
  const stamp = new Date().toISOString();
  const line = `[${stamp}] Viewed on ${req.context.platform}${req.notes ? ` — ${req.notes}` : ""}`;

  if (!linkedinUrl) {
    return {
      ok: true,
      action: "log_activity",
      summary: `Logged activity on ${who} (local only — no LinkedIn URL to attach)`,
      data: { loggedAt: stamp },
    };
  }

  const { data: existing } = await supabase
    .from("leads")
    .select("id, notes")
    .eq("linkedin_url", linkedinUrl)
    .maybeSingle();

  if (!existing) {
    return {
      ok: false,
      action: "log_activity",
      summary: "Lead not in CRM yet",
      error: "Sync this profile first, then log activity.",
    };
  }

  const notes = [existing.notes, line].filter(Boolean).join("\n");
  const { error } = await supabase
    .from("leads")
    .update({ notes })
    .eq("id", existing.id);

  if (error) {
    return {
      ok: false,
      action: "log_activity",
      summary: "Failed to log activity",
      error: error.message,
    };
  }

  return {
    ok: true,
    action: "log_activity",
    summary: `Logged activity on ${who}`,
    data: { leadId: existing.id, loggedAt: stamp },
  };
}

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
        summary: `Synced ${who} into your SaaS CRM (mock — configure Supabase)`,
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
 * Triggers automation: Sync/Log hit Supabase CRM when configured;
 * Enrich/Draft stay local helpers until you add providers.
 */
export async function runAutomation(
  session: AuthSession,
  request: AutomationRequest,
): Promise<AutomationResult> {
  if (API_BASE) {
    return callBackend("/api/extension/automate", session, request);
  }

  if (isSupabaseConfigured()) {
    if (request.action === "sync_crm") {
      return syncLeadToCrm(session, request);
    }
    if (request.action === "log_activity") {
      return logActivityToCrm(session, request);
    }
  }

  await new Promise((r) => setTimeout(r, 400));
  return mockAutomation(request);
}
