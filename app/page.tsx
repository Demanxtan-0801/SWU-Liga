'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Season, LeaderboardEntry } from '@/types'

export default function LeaderboardPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSeasons() }, [])
  useEffect(() => { if (selectedSeason) loadLeaderboard(selectedSeason) }, [selectedSeason])

  async function loadSeasons() {
    const { data } = await supabase.from('seasons').select('*').order('year', { ascending: false })
    if (data) {
      setSeasons(data)
      const active = data.find((s: Season) => s.is_active) || data[0]
      if (active) setSelectedSeason(active.id)
    }
    setLoading(false)
  }

  async function loadLeaderboard(seasonId: string) {
    setLoading(true)
    const { data } = await supabase.from('season_leaderboard').select('*').eq('season_id', seasonId).order('total_points', { ascending: false })
    if (data) setLeaderboard(data)
    setLoading(false)
  }

  const getRankClass = (pos: number) => pos === 1 ? 'rank-1' : pos === 2 ? 'rank-2' : pos === 3 ? 'rank-3' : ''
  const getRankIcon = (pos: number) => pos === 1 ? '🏆' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.4em', color: 'var(--holo-accent)', marginBottom: '0.75rem' }}>── TRANSMISIÓN IMPERIAL ──</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 6vw, 3rem)', fontWeight: 900, letterSpacing: '0.1em', color: 'var(--holo-primary)', textShadow: '0 0 30px rgba(0,212,255,0.5)', marginBottom: '0.5rem' }}>TABLA DE MANDO</h1>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>Rankings de la Liga SWTCG</p>
      </div>

      <div className="holo-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>TEMPORADA:</span>
          <select className="holo-select" value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} style={{ maxWidth: '100%', flex: 1, minWidth: '180px' }}>
            {seasons.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year}){s.is_active ? ' — ACTIVA' : ''}</option>)}
          </select>
          {seasons.find(s => s.id === selectedSeason)?.is_active && (
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--holo-accent)', border: '1px solid var(--holo-accent)', padding: '0.2rem 0.5rem', animation: 'pulse-glow 2s infinite', whiteSpace: 'nowrap' }}>EN VIVO</span>
          )}
        </div>
      </div>

      <div className="holo-card">
        {/* Table header — hidden on mobile, shown on desktop */}
        <div className="lb-header" style={{ display: 'grid', gridTemplateColumns: '48px 1fr 72px 90px 64px', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-dim)', gap: '0.5rem' }}>
          {['POS', 'PILOTO', 'TORNS', 'CAMP/OTROS', 'PTS'].map(h => (
            <div key={h} style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--text-dim)' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em' }}>CARGANDO...</div>
        ) : leaderboard.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em' }}>SIN DATOS — TEMPORADA PENDIENTE</div>
        ) : (
          leaderboard.map((entry, idx) => (
            <div key={entry.player_id} className="animate-in lb-row" style={{ animationDelay: `${idx * 0.06}s`, borderBottom: idx < leaderboard.length - 1 ? '1px solid var(--border-dim)' : 'none', background: idx < 3 ? `rgba(0,212,255,${0.03 - idx * 0.008})` : 'transparent' }}>
              {/* Desktop row */}
              <div className="lb-desktop" style={{ display: 'grid', gridTemplateColumns: '48px 1fr 72px 90px 64px', padding: '0.9rem 1rem', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: idx < 3 ? '1.1rem' : '0.85rem', fontWeight: 700 }} className={getRankClass(idx + 1)}>{getRankIcon(idx + 1)}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(0.7rem, 2vw, 0.85rem)', fontWeight: 600, color: idx === 0 ? 'var(--holo-gold)' : 'var(--text-primary)' }}>{entry.player_name}</div>
                <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{entry.tournaments_played}</div>
                <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--holo-accent)' }}>{entry.wins}</span>
                  <span style={{ color: 'var(--text-dim)' }}> / {Number(entry.tournaments_played) - Number(entry.wins)}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--holo-primary)' }}>
                  {entry.total_points}<span style={{ fontSize: '0.5rem', color: 'var(--text-dim)', marginLeft: '2px' }}>PT</span>
                </div>
              </div>

              {/* Mobile row */}
              <div className="lb-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: idx < 3 ? '1.1rem' : '0.8rem', fontWeight: 700, flexShrink: 0 }} className={getRankClass(idx + 1)}>{getRankIcon(idx + 1)}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 600, color: idx === 0 ? 'var(--holo-gold)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.player_name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                      {entry.tournaments_played} torneos · <span style={{ color: 'var(--holo-accent)' }}>{entry.wins}</span> camp
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--holo-primary)', flexShrink: 0 }}>
                  {entry.total_points}<span style={{ fontSize: '0.5rem', color: 'var(--text-dim)', marginLeft: '2px' }}>PT</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @media (min-width: 540px) {
          .lb-header { display: grid !important; }
          .lb-desktop { display: grid !important; }
          .lb-mobile { display: none !important; }
        }
        @media (max-width: 539px) {
          .lb-header { display: none !important; }
          .lb-desktop { display: none !important; }
          .lb-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
