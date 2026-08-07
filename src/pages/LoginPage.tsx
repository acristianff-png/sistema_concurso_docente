import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/brand'

export function LoginPage() {
  const { session, loading, signInWithPassword, signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    if (mode === 'password') {
      const { error: err } = await signInWithPassword(email, password)
      if (err) setError(err)
    } else {
      const { error: err } = await signInWithMagicLink(email)
      if (err) setError(err)
      else setInfo('Link de acesso enviado — confira seu e-mail.')
    }

    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-teal-dark px-4">
      <div className="w-full max-w-sm rounded-lg bg-paper p-8 shadow-xl">
        <div className="mb-1 font-mono text-xs uppercase tracking-widest text-coral">AM Mentoria</div>
        <h1 className="mb-6 font-display text-2xl font-medium text-ink">Barema Tracker</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-ink">
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-ink/20 bg-white px-3 py-2 text-ink focus:border-coral"
              autoComplete="email"
            />
          </label>

          {mode === 'password' ? (
            <label className="flex flex-col gap-1 text-sm text-ink">
              Senha
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-md border border-ink/20 bg-white px-3 py-2 text-ink focus:border-coral"
                autoComplete="current-password"
              />
            </label>
          ) : null}

          {error ? <p className="text-sm text-coral-dark">{error}</p> : null}
          {info ? <p className="text-sm text-teal-dark">{info}</p> : null}

          <Button type="submit" disabled={submitting}>
            {mode === 'password' ? 'Entrar' : 'Enviar link mágico'}
          </Button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'password' ? 'magic' : 'password')
              setError(null)
              setInfo(null)
            }}
            className="font-mono text-xs text-ink/60 underline hover:text-coral"
          >
            {mode === 'password' ? 'Usar link mágico por e-mail' : 'Usar e-mail e senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
