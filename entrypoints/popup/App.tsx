import { useEffect, useState } from "react";
import type { AuthSession } from "../../lib/types";
import { sendToBackground } from "../../lib/messaging";


export function PopupApp() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState("Checking session…");

  useEffect(() => {
    sendToBackground({ type: "GET_AUTH" }).then((res) => {
      if (res.type === "AUTH_STATE") {
        setSession(res.session);
        setStatus(res.session ? "Connected" : "Not connected");
      }
    });
  }, []);

  async function connect() {
    const res = await sendToBackground({ type: "LOGIN" });
    if (res.type === "AUTH_STATE") {
      setSession(res.session);
      setStatus("Connected");
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
      <h1>Integration layer</h1>
      <p className="lede">
        Embed your SaaS inside Salesforce, LinkedIn, and legacy tools — without
        forcing a dashboard migration.
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
        <button type="button" className="primary" onClick={connect}>
          Connect SaaS
        </button>
      )}
      <p className="hint">
        Open a matching host page (or the local demo) to use the side panel.
      </p>
    </main>
  );
}
