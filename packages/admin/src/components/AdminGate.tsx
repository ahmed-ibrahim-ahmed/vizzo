/**
 * @vizzo/admin — AdminGate Component & useAdmin Hook
 * Wraps protected admin routes. Authenticates session and verifies against the 'admins' table.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { createSupabaseClient } from '@vizzo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';

interface AdminContextType {
  adminEmail: string;
  supabase: SupabaseClient;
  signOut: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used inside <AdminGate>. No admin context found.');
  }
  return context;
}

interface AdminGateProps {
  children: React.ReactNode;
}

type GateState = 'loading' | 'unauthenticated' | 'unauthorized' | 'ready';

export function AdminGate({ children }: AdminGateProps) {
  const [gateState, setGateState] = useState<GateState>('loading');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const verifyWhitelist = useCallback(async () => {
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

      const email = session.user.email;
      if (!email) {
        setErrorMessage('الحساب لا يحتوي على بريد إلكتروني صالح.');
        setGateState('unauthorized');
        await client.auth.signOut();
        return;
      }

      // Query whitelist
      const { data: whitelistData, error: whitelistError } = await client
        .from('admins')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (whitelistError) {
        console.error('[AdminGate] Error verifying whitelist:', whitelistError.message);
        setErrorMessage('حدث خطأ أثناء التحقق من الصلاحيات.');
        setGateState('unauthorized');
        await client.auth.signOut();
        return;
      }

      if (!whitelistData) {
        console.warn(`[AdminGate] Unauthorized email attempt: ${email}`);
        setErrorMessage('عذراً، هذا البريد الإلكتروني ليس مسجلاً في قائمة المسؤولين المعتمدين.');
        setGateState('unauthorized');
        await client.auth.signOut();
        return;
      }

      setAdminEmail(email);
      setGateState('ready');
    } catch (err) {
      console.error('[AdminGate] Unexpected error during verification:', err);
      setGateState('unauthenticated');
    }
  }, []);

  useEffect(() => {
    verifyWhitelist();
  }, [verifyWhitelist]);

  useEffect(() => {
    if (!supabaseClient) return;

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          setGateState('unauthenticated');
          setAdminEmail('');
        } else if (event === 'SIGNED_IN') {
          verifyWhitelist();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseClient, verifyWhitelist]);

  const handleSignOut = async () => {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
  };

  if (gateState === 'loading') {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-pulse">
          <div className="pulse-circle"></div>
          <h1 className="pulse-logo">Vizzo</h1>
          <p className="pulse-text">جاري التحقق من صلاحيات المسؤول...</p>
        </div>
      </div>
    );
  }

  if (gateState === 'unauthorized') {
    return (
      <div className="admin-unauthorized-screen">
        <div className="unauthorized-card">
          <div className="unauthorized-icon">⚠️</div>
          <h2>دخول غير مصرح به</h2>
          <p>{errorMessage || 'هذا الحساب لا يملك صلاحيات الوصول للوحة الإدارة.'}</p>
          <button 
            className="unauthorized-back-btn" 
            onClick={() => setGateState('unauthenticated')}
          >
            العودة لصفحة الدخول
          </button>
        </div>
      </div>
    );
  }

  if (gateState === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminContext.Provider value={{ adminEmail, supabase: supabaseClient!, signOut: handleSignOut }}>
      {children}
    </AdminContext.Provider>
  );
}
