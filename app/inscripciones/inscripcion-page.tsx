'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type State = 'idle' | 'loading' | 'success' | 'error'

export default function InscripcionPage() {
  const [fullName, setFullName] = useState('')
  const [melegg, setMelegg] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !melegg.trim()) return
    setState('loading')
    setErrorMsg('')

    const { error } = await supabase.from('registrations').insert({
      full_name: fullName.trim(),
      melegg_username: melegg.trim(),
    })

    if (error) {
      setErrorMsg('Hubo un error al enviar tu inscripción. Intenta de nuevo.')
      setState('error')
    } else {
      setState('success')
    }
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '4rem 2rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.4em', color: 'var(--holo-accent)', marginBottom: '0.75rem' }}>
          ── FORMULARIO OFICIAL ──
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
          fontWeight: 900,
          letterSpacing: '0.1em',
          color: 'var(--holo-primary)',
          textShadow: '0 0 30px rgba(0,212,255,0.5)',
          marginBottom: '0.5rem',
        }}>
          INSCRIPCIÓN A LA LIGA
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '1rem' }}>
          Completa el formulario para unirte a la liga SWTCG
        </p>
      </div>

      {state === 'success' ? (
        /* Success state */
        <div className="holo-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--holo-accent)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            SOLICITUD ENVIADA
          </div>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.7 }}>
            Tu inscripción está pendiente de aprobación.<br />
            El administrador de la liga la revisará pronto.
          </p>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button className="holo-btn">VER LEADERBOARD</button>
          </Link>
        </div>
      ) : (
        /* Form */
        <div className="holo-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
                NOMBRE COMPLETO
              </label>
              <input
                type="text"
                className="holo-input"
                placeholder="Tu nombre completo..."
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                disabled={state === 'loading'}
              />
            </div>

            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
                USUARIO MELE.GG
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  color: 'var(--text-dim)',
                  pointerEvents: 'none',
                }}>
                  @
                </span>
                <input
                  type="text"
                  className="holo-input"
                  placeholder="tu_usuario"
                  value={melegg}
                  onChange={e => setMelegg(e.target.value)}
                  required
                  disabled={state === 'loading'}
                  style={{ paddingLeft: '1.75rem' }}
                />
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                Tu nombre de usuario en mele.gg
              </div>
            </div>

            {state === 'error' && (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--holo-danger)', border: '1px solid rgba(255,51,102,0.3)', padding: '0.75rem 1rem', background: 'rgba(255,51,102,0.05)' }}>
                ⚠ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="holo-btn"
              disabled={state === 'loading'}
              style={{ marginTop: '0.5rem', padding: '0.8rem', opacity: state === 'loading' ? 0.6 : 1, cursor: state === 'loading' ? 'not-allowed' : 'pointer' }}
            >
              {state === 'loading' ? 'ENVIANDO...' : 'ENVIAR INSCRIPCIÓN'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
