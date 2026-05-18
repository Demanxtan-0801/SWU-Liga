'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface HallEntry {
  id: string
  photo_url: string | null
  player: { name: string }
  season: { name: string; year: number }
}

export default function HallOfFamePage() {
  const [entries, setEntries] = useState<HallEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('hall_of_fame')
        .select('id, photo_url, player:players(name), season:seasons(name, year)')
        .order('created_at', { ascending: false })
      if (data) setEntries(data as unknown as HallEntry[])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 2rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.4em', color: 'var(--holo-gold)', marginBottom: '0.75rem' }}>
          ── ARCHIVOS DEL IMPERIO ──
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.8rem, 5vw, 3rem)',
          fontWeight: 900,
          letterSpacing: '0.12em',
          color: 'var(--holo-gold)',
          textShadow: '0 0 30px rgba(255,215,0,0.4), 0 0 60px rgba(255,215,0,0.15)',
          marginBottom: '0.5rem',
        }}>
          HALL DE LA FAMA
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '1rem' }}>
          Los campeones que han dominado la galaxia
        </p>
        <div style={{ marginTop: '1.5rem', height: '1px', background: 'linear-gradient(90deg, transparent, var(--holo-gold), transparent)', opacity: 0.4 }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.2em', padding: '4rem' }}>
          CONSULTANDO ARCHIVOS...
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.2em', padding: '4rem' }}>
          LOS ARCHIVOS ESTÁN VACÍOS — AÚN NO HAY CAMPEONES
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '2rem',
        }}>
          {entries.map((entry, idx) => (
            <div
              key={entry.id}
              className="holo-card animate-in"
              style={{
                animationDelay: `${idx * 0.1}s`,
                padding: '0',
                overflow: 'hidden',
                border: '1px solid rgba(255,215,0,0.2)',
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,215,0,0.6)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(255,215,0,0.2), 0 0 40px rgba(255,215,0,0.08)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,215,0,0.2)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
              }}
            >
              {/* Photo */}
              <div style={{
                width: '100%',
                aspectRatio: '1',
                background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {entry.photo_url ? (
                  <img
                    src={entry.photo_url}
                    alt={entry.player?.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}>
                    <div style={{ fontSize: '3rem', opacity: 0.3 }}>👤</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--text-dim)' }}>SIN FOTO</div>
                  </div>
                )}
                {/* Gold overlay corner */}
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  background: 'rgba(0,8,16,0.8)',
                  border: '1px solid rgba(255,215,0,0.4)',
                  padding: '0.2rem 0.5rem',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.5rem',
                  letterSpacing: '0.15em',
                  color: 'var(--holo-gold)',
                }}>
                  {entry.season?.year}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🏆</div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: 'var(--holo-gold)',
                  textShadow: '0 0 10px rgba(255,215,0,0.3)',
                  marginBottom: '0.25rem',
                }}>
                  {entry.player?.name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.55rem',
                  letterSpacing: '0.15em',
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                }}>
                  {entry.season?.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
