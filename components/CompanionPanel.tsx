import { useEffect, useState } from "react";
import type {
  AuthSession,
  AutomationAction,
  AutomationResult,
  PageContext,
} from "../lib/types";
import { sendToBackground } from "../lib/messaging";

interface Props {
  context: PageContext;
  onRefreshContext: () => void;
}

const ACTIONS: { id: AutomationAction; label: string; hint: string }[] = [
  { id: "enrich", label: "Enrich", hint: "Pull firmographics & intent" },
  { id: "sync_crm", label: "Sync to SaaS", hint: "Write into your product" },
  { id: "draft_outreach", label: "Draft outreach", hint: "AI message draft" },
  { id: "log_activity", label: "Log activity", hint: "Activity on current tool" },
];

export function CompanionPanel({ context, onRefreshContext }: Props) {
  const [open, setOpen] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AutomationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    sendToBackground({ type: "GET_AUTH" }).then((res) => {
      if (res.type === "AUTH_STATE") setSession(res.session);
    });
  }, []);

  async function login() {
    setError(null);
    setBusy(true);
    try {
      const res = await sendToBackground({
        type: "LOGIN",
        email,
        password,
      });
      if (res.type === "AUTH_STATE") setSession(res.session);
      else if (res.type === "ERROR") setError(res.message);
    } finally {
      setBusy(false);
    }
  }

  async function signup() {
    setError(null);
    setBusy(true);
    try {
      const res = await sendToBackground({
        type: "SIGNUP",
        email,
        password,
      });
      if (res.type === "AUTH_STATE") setSession(res.session);
      else if (res.type === "ERROR") setError(res.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await sendToBackground({ type: "LOGOUT" });
    setSession(null);
    setResult(null);
  }

  async function run(action: AutomationAction) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await sendToBackground({
        type: "RUN_AUTOMATION",
        payload: { action, context },
      });
      if (res.type === "AUTOMATION_RESULT") setResult(res.result);
      else if (res.type === "ERROR") setError(res.message);
    } finally {
      setBusy(false);
    }
  }

  const { fields, platform } = context;
  const displayName = fields.name || fields.email || "Current record";

  return (
    <div className="companion-root">
      <button
        type="button"
        className="companion-fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="Enterprise Companion"
      >
        EC
      </button>

      {open && (
        <aside className="companion-drawer" role="dialog" aria-label="Enterprise Companion">
          <header className="companion-header">
            <div>
              <p className="eyebrow">Enterprise Companion</p>
              <h2>Stay in {platform === "unknown" ? "this tool" : platform}</h2>
            </div>
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </header>

          <section className="companion-context">
            <div className="context-top">
              <strong>{displayName}</strong>
              <button type="button" className="linkish" onClick={onRefreshContext}>
                Refresh
              </button>
            </div>
            <dl>
              {fields.title && (
                <>
                  <dt>Title</dt>
                  <dd>{fields.title}</dd>
                </>
              )}
              {fields.company && (
                <>
                  <dt>Company</dt>
                  <dd>{fields.company}</dd>
                </>
              )}
              {fields.email && (
                <>
                  <dt>Email</dt>
                  <dd>{fields.email}</dd>
                </>
              )}
              {fields.recordId && (
                <>
                  <dt>Record</dt>
                  <dd className="mono">{fields.recordId}</dd>
                </>
              )}
            </dl>
          </section>

          <section className="companion-auth">
            {session ? (
              <div className="auth-row">
                <span>
                  Signed in as <em>{session.user.email}</em>
                </span>
                <button type="button" className="linkish" onClick={logout}>
                  Sign out
                </button>
              </div>
            ) : (
              <form
                className="auth-inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  void login();
                }}
              >
                <input
                  type="email"
                  placeholder="CRM email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <div className="auth-btns">
                  <button type="submit" className="primary" disabled={busy}>
                    Sign in
                  </button>
                  <button type="button" className="ghost" disabled={busy} onClick={() => void signup()}>
                    Sign up
                  </button>
                </div>
              </form>
            )}
          </section>

          {session && (
            <section className="companion-actions">
              <p className="section-label">Automation loop</p>
              <div className="action-grid">
                {ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="action-card"
                    disabled={busy}
                    onClick={() => run(a.id)}
                  >
                    <span className="action-label">{a.label}</span>
                    <span className="action-hint">{a.hint}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {(busy || result || error) && (
            <section className="companion-result">
              {busy && <p className="muted">Running automation…</p>}
              {error && <p className="error">{error}</p>}
              {result && (
                <div className={result.ok ? "ok" : "error"}>
                  <p className="result-summary">{result.summary}</p>
                  {result.data && (
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  )}
                </div>
              )}
            </section>
          )}

          <footer className="companion-footer">
            Bridge, don’t migrate — capabilities on the tools already open.
          </footer>
        </aside>
      )}
    </div>
  );
}
