/**
 * @vizzo/admin — useAuth Hook
 * Custom hook for auth state management in the administrative dashboard.
 * Supports Google OAuth redirects and sign-out actions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session, User, SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '@vizzo/shared';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  supabase: SupabaseClient | null;
}

export function useAuth(): AuthState {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createSupabaseClient();
    supabaseRef.current = client;

    if (!client) {
      setLoading(false);
      return;
    }

    let mounted = true;

    client.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = client.auth.onAuthStateChange(
      (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async () => {
    const client = supabaseRef.current;
    if (!client) {
      console.warn('[Vizzo Admin] Cannot sign in — Supabase client not configured.');
      return;
    }

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('[Vizzo Admin] Google OAuth sign-in failed:', error.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    const client = supabaseRef.current;
    if (!client) {
      console.warn('[Vizzo Admin] Cannot sign out — Supabase client not configured.');
      return;
    }

    const { error } = await client.auth.signOut();
    if (error) {
      console.error('[Vizzo Admin] Sign out failed:', error.message);
    }
  }, []);

  return {
    session,
    user,
    loading,
    signIn,
    signOut,
    supabase: supabaseRef.current,
  };
}
