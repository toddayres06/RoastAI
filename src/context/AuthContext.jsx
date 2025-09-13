import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    // 1) Load existing session on first render
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ignore) {
        setSession(session ?? null)
        setLoading(false)
      }
    })

    // 2) Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession ?? null)
    )

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

async function signInWithEmail(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin, // e.g., http://localhost:5173 or 5174
      shouldCreateUser: true,                   // ✅ important
    },
  })
  if (error) throw error
  return true
}


  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signInWithEmail,
      signOut
    }),
    [session, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider />')
  return ctx
}
