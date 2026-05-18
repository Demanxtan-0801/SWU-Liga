'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Credenciales incorrectas. Acceso denegado.')
    } else {
      router.push('/admin/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '2px solid rgba(255,170,0,0.5)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 20px rgba(255,170,0,0.2)',
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚙</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: 'var(--holo-warn)',
            textShadow: '0 0 15px rgba(255,170,0,0.3)',
          }}>
            ACCESO IMPERIAL
          </h1>
          <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
            Panel de Administración Restringido
          </p>
        </div>

        {/* Form */}
        <div className="holo-card" style={{ padding: '2rem', border: '1px solid rgba(255,170,0,0.2)' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
                IDENTIFICACIÓN
              </label>
              <input
                type="email"
                className="holo-input"
                placeholder="admin@liga.sw"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ borderColor: 'rgba(255,170,0,0.2)' }}
              />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
                CÓDIGO DE ACCESO
              </label>
              <input
                type="password"
                className="holo-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ borderColor: 'rgba(255,170,0,0.2)' }}
              />
            </div>

            {error && (
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.6rem',
                letterSpacing: '0.1em',
                color: 'var(--holo-danger)',
                border: '1px solid rgba(255,51,102,0.3)',
                padding: '0.75rem 1rem',
                background: 'rgba(255,51,102,0.05)',
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="holo-btn"
              style={{
                marginTop: '0.5rem',
                padding: '0.8rem',
                borderColor: 'var(--holo-warn)',
                color: 'var(--holo-warn)',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'VERIFICANDO...' : 'ACCEDER'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
