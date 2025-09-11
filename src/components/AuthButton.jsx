import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthButton() {
  const { user, loading, signInWithEmail, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (loading) return null

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-200">
          {user.email}
        </span>
        <button
          onClick={() => signOut()}
          className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true); setError(null)
        try {
          await signInWithEmail(email)
          setSent(true)
        } catch (err) {
          setError(err.message ?? 'Sign-in failed')
        } finally {
          setBusy(false)
        }
      }}
      className="flex items-center gap-2"
    >
      {sent ? (
        <span className="text-sm text-emerald-300">Check your email ✉️</span>
      ) : (
        <>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg bg-white/10 px-3 py-1 text-sm text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/20 disabled:opacity-50"
          >
            Sign in
          </button>
          {error && <span className="text-xs text-red-300">{error}</span>}
        </>
      )}
    </form>
  )
}
