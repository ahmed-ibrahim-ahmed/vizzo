/**
 * @vizzo/shared — Supabase Client Factory
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from import.meta.env.
 * Single factory, no singleton cache — each app creates its own instance.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a new Supabase client instance.
 * Each app (landing, dashboard, storefront) should create its own instance.
 */
export function createSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  if (!url || !anonKey) {
    console.warn(
      '[Vizzo] Supabase env vars missing — auth features disabled. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable.'
    );
    return null;
  }

  return createClient(url, anonKey);
}

/**
 * Creates a Supabase client with service role key for server-side operations.
 * Must NEVER be exposed to the client — server/SSR use only.
 */
export function createSupabaseServerClient(): SupabaseClient {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase server environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
