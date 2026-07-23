import type { AuthSession } from "./types";

const AUTH_KEY = "auth_session";

/**
 * Session storage helpers.
 * In production: store only opaque tokens; refresh via your SaaS OAuth endpoint.
 * Prefer chrome.identity.launchWebAuthFlow for real OAuth2.
 */
export async function getSession(): Promise<AuthSession | null> {
  const raw = await browser.storage.local.get(AUTH_KEY);
  const session = raw[AUTH_KEY] as AuthSession | undefined;
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    await clearSession();
    return null;
  }
  return session;
}

export async function setSession(session: AuthSession): Promise<void> {
  await browser.storage.local.set({ [AUTH_KEY]: session });
}

export async function clearSession(): Promise<void> {
  await browser.storage.local.remove(AUTH_KEY);
}

/**
 * Demo login — swap for OAuth2 / Chrome identity API against your SaaS.
 *
 * Real flow sketch:
 * 1. browser.identity.launchWebAuthFlow({ url: authorizeUrl, interactive: true })
 * 2. Exchange code at your backend for JWT
 * 3. setSession({ accessToken, expiresAt, user })
 */
export async function loginDemo(email = "ae@acme-saas.com"): Promise<AuthSession> {
  const session: AuthSession = {
    accessToken: `demo_${crypto.randomUUID()}`,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    user: {
      id: "usr_demo",
      email,
      name: "Account Executive",
    },
  };
  await setSession(session);
  return session;
}
