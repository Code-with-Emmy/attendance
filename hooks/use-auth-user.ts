"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/client/api";

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  department: string | null;
  title: string | null;
  bio: string | null;
  role: "USER" | "ADMIN" | "MASTER_ADMIN" | "ORG_ADMIN" | "HR" | "MANAGER" | "VIEWER";
  faceEnrolledAt: string | null;
  organizationId: string;
  organizationName: string;
};

export function useAuthUser(options?: { requireAdmin?: boolean; requireMasterAdmin?: boolean }) {
  const router = useRouter();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [error, setError] = useState("");

  const loadUser = useCallback(
    async (activeSession: Session | null) => {
      if (!activeSession?.access_token) {
        setUser(null);
        return;
      }

      setLoadingUser(true);
      setError("");

      try {
        const me = await apiFetch<AppUser>("/api/me", {
          method: "GET",
          accessToken: activeSession.access_token,
        });
        setUser(me);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load user profile.";
        setError(message);
      } finally {
        setLoadingUser(false);
      }
    },
    [],
  );

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
      setSessionReady(true);
      return;
    }
    setSupabase(client);
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) {
          return;
        }

        setSession(data.session);
        setSessionReady(true);
        void loadUser(data.session);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setSessionReady(true);
        setSession(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadUser(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUser, supabase]);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    if (!session) {
      router.replace("/");
    }
  }, [router, session, sessionReady]);

  useEffect(() => {
    if (!user) {
      return;
    }
    
    if (options?.requireMasterAdmin && user.role !== "MASTER_ADMIN") {
      router.replace("/login");
      return;
    }

    if (options?.requireAdmin && user.role !== "ADMIN" && user.role !== "MASTER_ADMIN" && user.role !== "ORG_ADMIN") {
      router.replace("/kiosk");
    }
  }, [options?.requireAdmin, options?.requireMasterAdmin, router, user]);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    router.replace("/");
  }, [router, supabase]);

  return {
    session,
    user,
    loading: !sessionReady || (Boolean(session) && loadingUser),
    error,
    refreshUser: () => loadUser(session),
    signOut,
  };
}
