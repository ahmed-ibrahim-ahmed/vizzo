/**
 * @vizzo/dashboard — AuthGate Component & useStore Hook
 * Wraps protected routes. Redirects based on auth and onboarding state.
 * - loading → centered Vizzo logo with pulse animation (skeleton, not spinner — AP-05)
 * - !session → redirect to /login
 * - session + no store → redirect to /onboarding
 * - session + store → render children with StoreContext
 *
 * StoreContext provides { store, merchant, setStore, refetch }
 * for all dashboard components to consume.
 */

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { createSupabaseClient } from '@vizzo/shared';
import type { Store, Merchant } from '@vizzo/shared';
import '../styles/auth.css';

interface StoreContextValue {
  store: Store;
  merchant: Merchant;
  setStore: (store: Store) => void;
  refetch: () => void;
}

export const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside <AuthGate>. No store context found.');
  }
  return ctx;
}

interface AuthGateProps {
  children: React.ReactNode;
}

type GateState = 'loading' | 'unauthenticated' | 'onboarding' | 'ready';

export function AuthGate({ children }: AuthGateProps) {
  const [gateState, setGateState] = useState<GateState>('loading');
  const [store, setStore] = useState<Store | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createSupabaseClient> | null>(null);

  const fetchStoreData = useCallback(async () => {
    const client = createSupabaseClient();
    if (!client) {
      setGateState('unauthenticated');
      return;
    }

    setSupabaseClient(client);

    try {
      const { data: { session } } = await client.auth.getSession();

      if (!session?.user) {
        setGateState('unauthenticated');
        return;
      }

      const googleId = session.user.user_metadata?.sub || session.user.id;

      const { data: merchantData, error: merchantError } = await client
        .from('merchants')
        .select('*')
        .eq('google_id', googleId)
        .maybeSingle();

      if (merchantError) {
        console.error('[AuthGate] Error fetching merchant:', merchantError.message);
        setGateState('onboarding');
        return;
      }

      if (!merchantData) {
        setGateState('onboarding');
        return;
      }

      setMerchant(merchantData as Merchant);

      const { data: storeData, error: storeError } = await client
        .from('stores')
        .select('*')
        .eq('merchant_id', merchantData.id)
        .maybeSingle();

      if (storeError) {
        console.error('[AuthGate] Error fetching store:', storeError.message);
        setGateState('onboarding');
        return;
      }

      if (!storeData) {
        setGateState('onboarding');
        return;
      }

      setStore(storeData as Store);
      setGateState('ready');
    } catch (err) {
      console.error('[AuthGate] Unexpected error:', err);
      setGateState('unauthenticated');
    }
  }, []);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  useEffect(() => {
    if (!supabaseClient) return;

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          setGateState('unauthenticated');
          setStore(null);
          setMerchant(null);
        } else if (event === 'SIGNED_IN') {
          fetchStoreData();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseClient, fetchStoreData]);

  if (gateState === 'loading') {
    return (
      <div className="auth-loading">
        <div className="auth-loading-logo">Vizzo</div>
      </div>
    );
  }

  if (gateState === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (gateState === 'onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (!store || !merchant) {
    return <Navigate to="/login" replace />;
  }

  return (
    <StoreContext.Provider value={{ store, merchant, setStore, refetch: fetchStoreData }}>
      {children}
    </StoreContext.Provider>
  );
}
