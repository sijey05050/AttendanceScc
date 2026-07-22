import { createClient, SupabaseClient } from '@supabase/supabase-js';

const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || 'okijgymxwrjcyavmlmsx';
const defaultUrl = `https://${projectId}.supabase.co`;

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let adminClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

export function getSupabaseConfig() {
  return {
    url: supabaseUrl,
    hasAnonKey: Boolean(supabaseAnonKey),
    hasServiceRoleKey: Boolean(supabaseServiceRoleKey),
  };
}

export function getSupabaseAdminClient() {
  if (!supabaseServiceRoleKey) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}

export function getSupabaseAnonClient() {
  if (!supabaseAnonKey) {
    return null;
  }

  if (!anonClient) {
    anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return anonClient;
}
