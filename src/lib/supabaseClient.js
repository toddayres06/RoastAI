import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
if (import.meta.env.DEV && typeof window !== 'undefined') {
  console.log('[env] SUPABASE_URL present?', Boolean(supabaseUrl));
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// dev convenience: expose client in the browser console
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.supabase = supabase
}
