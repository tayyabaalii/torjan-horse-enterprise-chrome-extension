import type { AuthSession } from "./types";
import { createAnonClient, isSupabaseConfigured } from "./supabase";

const AUTH_KEY = "auth_session";

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

function toAuthSession(
  accessToken: string,
  refreshToken: string | undefined,
  expiresIn: number | undefined,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> },
): AuthSession {
  const metaName = user.user_metadata?.full_name || user.user_metadata?.name;
  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + (expiresIn ?? 3600) * 1000 - 30_000,
    user: {
      id: user.id,
      email: user.email || "unknown",
      name: typeof metaName === "string" ? metaName : user.email || "User",
    },
  };
}

/**
 * Sign in with Supabase email/password.
 * Falls back to demo session only when Supabase env vars are missing.
 */
export async function loginWithPassword(
  email: string,
  password: string,
): Promise<AuthSession> {
  if (!isSupabaseConfigured()) {
    return loginDemo(email);
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    throw new Error(error?.message || "Sign-in failed");
  }

  const session = toAuthSession(
    data.session.access_token,
    data.session.refresh_token,
    data.session.expires_in,
    data.user,
  );
  await setSession(session);
  return session;
}

/** Create a CRM account (email/password) then store the session */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<AuthSession> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured — cannot sign up");
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session || !data.user) {
    throw new Error(
      "Account created. Confirm your email in Supabase (or disable email confirmation), then sign in.",
    );
  }

  const session = toAuthSession(
    data.session.access_token,
    data.session.refresh_token,
    data.session.expires_in,
    data.user,
  );
  await setSession(session);
  return session;
}

/** Demo-only login when CRM backend is not configured */
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
