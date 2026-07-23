import { useEffect, useState } from "react";
import type { AuthSession } from "../../lib/types";
import { sendToBackground } from "../../lib/messaging";

export function PopupApp() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState("Checking session…");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sendToBackground({ type: "GET_AUTH" }).then((res) => {
      if (res.type === "AUTH_STATE") {
        setSession(res.session);
        setStatus(res.session ? "Connected" : "Not connected");
      }
    });
  }, []);

  async function connect(mode: "login" | "signup") {
    setBusy(true);
    setError(null);
    try {
      const res = await sendToBackground(
        mode === "login"
          ? { type: "LOGIN", email, password }
          : { type: "SIGNUP", email, password },
      );
      if (res.type === "AUTH_STATE") {
        setSession(res.session);
        setStatus("Connected");
        setPassword("");
      } else if (res.type === "ERROR") {
        setError(res.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    await sendToBackground({ type: "LOGOUT" });
    setSession(null);
    setStatus("Not connected");
  }

  return (
    <main className="popup">
      <p className="brand">Enterprise Companion</p>
      <h1>Your CRM bridge</h1>
      <p className="lede">
        Sync LinkedIn (and other hosts) into your Supabase CRM without leaving
        the page.
      </p>
      <p className="status">
        Status: <strong>{status}</strong>
        {session ? ` · ${session.user.email}` : null}
      </p>

      {session ? (
        <button type="button" onClick={disconnect}>
          Sign out
        </button>
      ) : (
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            void connect("login");
          }}
        >
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <div className="btn-row">
            <button type="submit" className="primary" disabled={busy}>
              Sign in
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void connect("signup")}
            >
              Sign up
            </button>
          </div>
        </form>
      )}

      <p className="hint">
        Open LinkedIn → click <strong>EC</strong> → Sync to SaaS. View leads in{" "}
        <code>crm.html</code> (see README).
      </p>
    </main>
  );
}
