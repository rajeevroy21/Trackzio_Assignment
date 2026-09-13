import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";

const LOCAL_SESSION_KEY = "cineframe_local_session";

export interface LocalSession {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function setLocalSession(email: string) {
  const hashHex = Math.abs(hashString(email)).toString(16).padStart(12, "0");
  const cleanId = `00000000-0000-0000-0000-${hashHex}`;
  const token = `local_:${cleanId}:${email}`;
  const data: LocalSession = {
    token,
    user: { id: cleanId, email },
  };
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("cineframe-auth-change"));
}

export function clearLocalSession() {
  localStorage.removeItem(LOCAL_SESSION_KEY);
  window.dispatchEvent(new Event("cineframe-auth-change"));
}

export async function getFreshToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const updateAuthState = async () => {
    // Check local session first (skip if it contains dummy local_: token)
    const rawLocal = localStorage.getItem(LOCAL_SESSION_KEY);
    if (rawLocal) {
      try {
        const parsed = JSON.parse(rawLocal) as LocalSession;
        if (parsed.token && !parsed.token.startsWith("local_:")) {
          setUser({
            id: parsed.user.id,
            email: parsed.user.email,
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          });
          setSessionToken(parsed.token);
          setLoading(false);
          return;
        } else {
          localStorage.removeItem(LOCAL_SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(LOCAL_SESSION_KEY);
      }
    }

    // Fall back to Supabase session
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setUser(data.session.user);
      setSessionToken(data.session.access_token);
    } else {
      setUser(null);
      setSessionToken(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;

    const handleAuthChange = () => {
      if (active) void updateAuthState();
    };

    window.addEventListener("cineframe-auth-change", handleAuthChange);

    const { data: sub } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!active) return;
      if (currentSession) {
        setUser(currentSession.user);
        setSessionToken(currentSession.access_token);
      } else {
        void updateAuthState();
      }
      setLoading(false);
    });

    void updateAuthState();

    return () => {
      active = false;
      window.removeEventListener("cineframe-auth-change", handleAuthChange);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    clearLocalSession();
    await supabase.auth.signOut();
    window.dispatchEvent(new Event("cineframe-auth-change"));
  };

  return {
    user,
    token: sessionToken,
    loading,
    signedIn: Boolean(user),
    signOut,
  };
}
