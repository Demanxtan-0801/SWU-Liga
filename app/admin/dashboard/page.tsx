'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPointsForPosition, getPositionLabel } from '@/lib/supabase'
import { Season, Player, Tournament } from '@/types'

type Tab = 'tournament' | 'players' | 'seasons' | 'hof' | 'registrations'

interface Registration {
  id: string
  full_name: string
  melegg_username: string
  status: string
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('tournament')
  const [seasons, setSeasons] = useState<Season[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const [selSeason, setSelSeason] = useState('')
  const [tournName, setTournName] = useState('')
  const [tournDate, setTournDate] = useState(new Date().toISOString().split('T')[0])
  const [results, setResults] = useState<Record<string, number>>({})
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newSeasonName, setNewSeasonName] = useState('')
  const [newSeasonYear, setNewSeasonYear] = useState(new Date().getFullYear())
  const [hofSeason, setHofSeason] = useState('')
  const [hofPlayer, setHofPlayer] = useState('')
  const [hofPhoto, setHofPhoto] = useState<File | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/admin/login')
      else loadData()
    })
  }, [])

  async function loadData() {
    const [{ data: s }, { data: p }, { data: t }, { data: r }] = await Promise.all([
      supabase.from('seasons').select('*').order('year', { ascending: false }),
      supabase.from('players').select('*').order('name'),
      supabase.from('tournaments').select('*').order('date', { ascending: false }),
      supabase.from('registrations').select('*').order('created_at', { ascending: false }),
    ])
    if (s) { setSeasons(s); setSelSeason(s.find((x: Season) => x.is_active)?.id || s[0]?.id || '') }
    if (p) setPlayers(p)
    if (t) setTournaments(t)
    if (r) setRegistrations(r)
    setLoading(false)
  }

  async function logout() { await supabase.auth.signOut(); router.push('/admin/login') }
  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  async function submitTournament() {
    if (!selSeason || !tournName || !tournDate) return flash('⚠ Completa todos los campos')
    const participants = Object.keys(results)
    if (participants.length === 0) return flash('⚠ Selecciona al menos un participante')
    const { data: tourn, error: te } = await supabase.from('tournaments').insert({ season_id: selSeason, name: tournName, date: tournDate }).select().single()
    if (te) return flash('Error: ' + te.message)
    const rows = participants.map(pid => ({ tournament_id: tourn.id, player_id: pid, position: results[pid], points_earned: getPointsForPosition(results[pid]) }))
    const { error: re } = await supabase.from('tournament_results').insert(rows)
    if (re) return flash('Error: ' + re.message)
    setTournName(''); setResults({}); setTournDate(new Date().toISOString().split('T')[0])
    loadData(); flash('✅ Torneo registrado')
  }

  async function addPlayer() {
    if (!newPlayerName.trim()) return
    const { error } = await supabase.from('players').insert({ name: newPlayerName.trim() })
    if (error) return flash('Error: ' + error.message)
    setNewPlayerName(''); loadData(); flash('✅ Jugador agregado')
  }

  async function addSeason() {
    if (!newSeasonName.trim()) return
    const { error } = await supabase.from('seasons').insert({ name: newSeasonName.trim(), year: newSeasonYear, is_active: false })
    if (error) return flash('Error: ' + error.message)
    setNewSeasonName(''); loadData(); flash('✅ Temporada creada')
  }

  async function setActiveSeason(id: string) {
    await supabase.from('seasons').update({ is_active: false }).neq('id', id)
    await supabase.from('seasons').update({ is_active: true }).eq('id', id)
    loadData(); flash('✅ Temporada activa actualizada')
  }

  async function submitHof() {
    if (!hofSeason || !hofPlayer) return flash('⚠ Selecciona temporada y jugador')
    let photoUrl = null
    if (hofPhoto) {
      const ext = hofPhoto.name.split('.').pop()
      const path = `champions/${hofSeason}-${hofPlayer}.${ext}`
      const { error: ue } = await supabase.storage.from('hall-of-fame').upload(path, hofPhoto, { upsert: true })
      if (ue) return flash('Error subiendo foto: ' + ue.message)
      const { data: url } = supabase.storage.from('hall-of-fame').getPublicUrl(path)
      photoUrl = url.publicUrl
    }
    const { error } = await supabase.from('hall_of_fame').upsert({ season_id: hofSeason, player_id: hofPlayer, photo_url: photoUrl }, { onConflict: 'season_id' })
    if (error) return flash('Error: ' + error.message)
    setHofSeason(''); setHofPlayer(''); setHofPhoto(null)
    flash('✅ Hall de la Fama actualizado')
  }

  async function approveRegistration(id: string, fullName: string) {
    const { error: pe } = await supabase.from('players').insert({ name: fullName })
    if (pe) return flash('Error: ' + pe.message)
    await supabase.from('registrations').update({ status: 'approved' }).eq('id', id)
    loadData(); flash('✅ Jugador aprobado')
  }

  async function rejectRegistration(id: string) {
    await supabase.from('registrations').update({ status: 'rejected' }).eq('id', id)
    loadData(); flash('✅ Inscripción rechazada')
  }

  const pendingCount = registrations.filter(r => r.status === 'pending').length

  const tabStyle = (t: Tab) => ({
    fontFamily: 'var(--font-display)', fontSize: '0.55rem', letterSpacing: '0.12em',
    padding: '0.65rem 0.9rem', cursor: 'pointer', border: 'none', background: 'transparent',
    color: tab === t ? 'var(--holo-warn)' : 'var(--text-dim)',
    borderBottom: tab === t ? '2px solid var(--holo-warn)' : '2px solid transparent',
    transition: 'all 0.2s', whiteSpace: 'nowrap' as const,
  })

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--text-dim)' }}>CARGANDO...</div>
  )

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.25rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', letterSpacing: '0.3em', color: 'var(--holo-warn)', marginBottom: '0.2rem' }}>PANEL DE CONTROL</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 4vw, 1.5rem)', fontWeight: 700, color: 'var(--holo-warn)' }}>ADMINISTRACIÓN</h1>
        </div>
        <button onClick={logout} className="holo-btn" style={{ borderColor: 'var(--holo-danger)', color: 'var(--holo-danger)', flexShrink: 0 }}>SALIR</button>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.1em', color: msg.startsWith('✅') ? 'var(--holo-accent)' : 'var(--holo-danger)', border: `1px solid ${msg.startsWith('✅') ? 'rgba(0,255,204,0.3)' : 'rgba(255,51,102,0.3)'}`, background: msg.startsWith('✅') ? 'rgba(0,255,204,0.05)' : 'rgba(255,51,102,0.05)' }}>
          {msg}
        </div>
      )}

      {/* Tabs — scrollable on mobile */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <button style={tabStyle('tournament')} onClick={() => setTab('tournament')}>⚔ TORNEO</button>
        <button style={tabStyle('players')} onClick={() => setTab('players')}>👤 JUGADORES</button>
        <button style={tabStyle('seasons')} onClick={() => setTab('seasons')}>📅 TEMPORADAS</button>
        <button style={tabStyle('hof')} onClick={() => setTab('hof')}>🏆 HOF</button>
        <button style={tabStyle('registrations')} onClick={() => setTab('registrations')}>
          📋{pendingCount > 0 ? ` (${pendingCount})` : ' INSCRIPC.'}
        </button>
      </div>

      {/* TOURNAMENT TAB */}
      {tab === 'tournament' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="holo-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--holo-primary)', marginBottom: '1rem' }}>REGISTRAR TORNEO</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.35rem' }}>TEMPORADA</label>
                <select className="holo-select" value={selSeason} onChange={e => setSelSeason(e.target.value)}>
                  {seasons.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.35rem' }}>NOMBRE</label>
                <input className="holo-input" placeholder="Semana 1, Torneo enero..." value={tournName} onChange={e => setTournName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.35rem' }}>FECHA</label>
                <input type="date" className="holo-input" value={tournDate} onChange={e => setTournDate(e.target.value)} />
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--text-dim)', marginBottom: '0.6rem' }}>PARTICIPANTES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {players.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', background: results[p.id] !== undefined ? 'rgba(0,212,255,0.05)' : 'transparent', border: `1px solid ${results[p.id] !== undefined ? 'var(--border-dim)' : 'transparent'}`, borderRadius: '2px' }}>
                  <input type="checkbox" checked={results[p.id] !== undefined}
                    onChange={e => setResults(prev => { const n = { ...prev }; if (e.target.checked) n[p.id] = 0; else delete n[p.id]; return n })}
                    style={{ accentColor: 'var(--holo-primary)', width: '18px', height: '18px', flexShrink: 0 }}
                  />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', flex: 1, color: results[p.id] !== undefined ? 'var(--text-primary)' : 'var(--text-dim)' }}>{p.name}</span>
                  {results[p.id] !== undefined && (
                    <select className="holo-select" value={results[p.id]} onChange={e => setResults(prev => ({ ...prev, [p.id]: Number(e.target.value) }))} style={{ width: 'auto', padding: '0.3rem 0.4rem', fontSize: '0.75rem' }}>
                      <option value={0}>✅ Asistente (1pt)</option>
                      <option value={4}>⚔️ Top 4 (2pt)</option>
                      <option value={3}>🥉 Top 3 (3pt)</option>
                      <option value={2}>🥈 Finalista (4pt)</option>
                      <option value={1}>🏆 Campeón (6pt)</option>
                    </select>
                  )}
                </div>
              ))}
            </div>

            {Object.keys(results).length > 0 && (
              <div style={{ padding: '0.75rem', background: 'rgba(0,212,255,0.03)', border: '1px solid var(--border-dim)', marginBottom: '1rem', borderRadius: '2px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>RESUMEN</div>
                {Object.entries(results).map(([pid, pos]) => {
                  const player = players.find(p => p.id === pid)
                  return (
                    <div key={pid} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>{player?.name}</span>
                      <span>{getPositionLabel(pos)} — <strong style={{ color: 'var(--holo-primary)' }}>{getPointsForPosition(pos)}pt</strong></span>
                    </div>
                  )
                })}
              </div>
            )}
            <button className="holo-btn" onClick={submitTournament} style={{ width: '100%', padding: '0.8rem' }}>REGISTRAR TORNEO</button>
          </div>

          {tournaments.length > 0 && (
            <div className="holo-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>RECIENTES</div>
              {tournaments.slice(0, 6).map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-dim)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '0.5rem' }}>{t.name}</span>
                  <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>{new Date(t.date).toLocaleDateString('es-CL')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PLAYERS TAB */}
      {tab === 'players' && (
        <div className="holo-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--holo-primary)', marginBottom: '1rem' }}>JUGADORES</div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <input className="holo-input" placeholder="Nombre del jugador..." value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPlayer()} />
            <button className="holo-btn" onClick={addPlayer} style={{ whiteSpace: 'nowrap' }}>+</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {players.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem', background: 'var(--bg-surface)', borderRadius: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', color: 'var(--text-dim)', width: '20px' }}>#{i + 1}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem' }}>{p.name}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-dim)' }}>{new Date(p.created_at).toLocaleDateString('es-CL')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEASONS TAB */}
      {tab === 'seasons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="holo-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--holo-primary)', marginBottom: '1rem' }}>CREAR TEMPORADA</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.35rem' }}>NOMBRE</label>
                <input className="holo-input" placeholder="Temporada 1..." value={newSeasonName} onChange={e => setNewSeasonName(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                </div>
                <button className="holo-btn" onClick={addSeason} style={{ flexShrink: 0 }}>CREAR</button>
              </div>
            </div>
          </div>

          <div className="holo-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>EXISTENTES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {seasons.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', background: 'var(--bg-surface)', borderRadius: '2px', border: s.is_active ? '1px solid rgba(0,255,204,0.3)' : '1px solid transparent', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{s.name}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-dim)' }}>{s.year}</div>
                  </div>
                  {s.is_active
                    ? <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--holo-accent)', border: '1px solid var(--holo-accent)', padding: '0.2rem 0.5rem', flexShrink: 0 }}>ACTIVA</span>
                    : <button className="holo-btn" onClick={() => setActiveSeason(s.id)} style={{ fontSize: '0.5rem', padding: '0.35rem 0.7rem', flexShrink: 0 }}>ACTIVAR</button>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HALL OF FAME TAB */}
      {tab === 'hof' && (
        <div className="holo-card" style={{ padding: '1.25rem', border: '1px solid rgba(255,215,0,0.2)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--holo-gold)', marginBottom: '1rem' }}>HALL DE LA FAMA</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.35rem' }}>TEMPORADA</label>
              <select className="holo-select" value={hofSeason} onChange={e => setHofSeason(e.target.value)}>
                <option value="">Seleccionar...</option>
                {seasons.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.35rem' }}>CAMPEÓN</label>
              <select className="holo-select" value={hofPlayer} onChange={e => setHofPlayer(e.target.value)}>
                <option value="">Seleccionar...</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.35rem' }}>FOTO</label>
              <input type="file" accept="image/*" onChange={e => setHofPhoto(e.target.files?.[0] || null)} style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '0.85rem', width: '100%' }} />
            </div>
            <button className="holo-btn" onClick={submitHof} style={{ width: '100%', padding: '0.8rem', borderColor: 'var(--holo-gold)', color: 'var(--holo-gold)' }}>
              CONSAGRAR CAMPEÓN
            </button>
          </div>
        </div>
      )}

      {/* REGISTRATIONS TAB */}
      {tab === 'registrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {registrations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--text-dim)' }}>SIN INSCRIPCIONES AÚN</div>
          ) : (
            <>
              {registrations.filter(r => r.status === 'pending').length > 0 && (
                <div className="holo-card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--holo-warn)', marginBottom: '0.75rem' }}>
                    PENDIENTES ({registrations.filter(r => r.status === 'pending').length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {registrations.filter(r => r.status === 'pending').map(r => (
                      <div key={r.id} style={{ padding: '0.85rem', background: 'rgba(255,170,0,0.04)', border: '1px solid rgba(255,170,0,0.15)', borderRadius: '2px' }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.2rem' }}>{r.full_name}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>@{r.melegg_username} · {new Date(r.created_at).toLocaleDateString('es-CL')}</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="holo-btn" onClick={() => approveRegistration(r.id, r.full_name)} style={{ flex: 1, borderColor: 'var(--holo-accent)', color: 'var(--holo-accent)', fontSize: '0.55rem', padding: '0.5rem' }}>✓ APROBAR</button>
                          <button className="holo-btn" onClick={() => rejectRegistration(r.id)} style={{ flex: 1, borderColor: 'var(--holo-danger)', color: 'var(--holo-danger)', fontSize: '0.55rem', padding: '0.5rem' }}>✕ RECHAZAR</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {registrations.filter(r => r.status !== 'pending').length > 0 && (
                <div className="holo-card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>PROCESADAS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {registrations.filter(r => r.status !== 'pending').map(r => (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem', background: 'var(--bg-surface)', borderRadius: '2px', gap: '0.5rem' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.full_name}</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: 'var(--text-dim)' }}>@{r.melegg_username}</div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: r.status === 'approved' ? 'var(--holo-accent)' : 'var(--holo-danger)', border: `1px solid ${r.status === 'approved' ? 'rgba(0,255,204,0.3)' : 'rgba(255,51,102,0.3)'}`, padding: '0.2rem 0.5rem', flexShrink: 0 }}>
                          {r.status === 'approved' ? 'APROBADO' : 'RECHAZADO'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
