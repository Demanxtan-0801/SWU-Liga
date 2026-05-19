'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPointsForPosition, getPositionLabel } from '@/lib/supabase'
import { Season, Player, Tournament } from '@/types'

type Tab = 'tournament' | 'players' | 'seasons' | 'hof' | 'registrations'

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('tournament')
  const [seasons, setSeasons] = useState<Season[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [registrations, setRegistrations] = useState<{id:string, full_name:string, melegg_username:string, status:string, created_at:string}[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  // Tournament form
  const [selSeason, setSelSeason] = useState('')
  const [tournName, setTournName] = useState('')
  const [tournDate, setTournDate] = useState(new Date().toISOString().split('T')[0])
  const [results, setResults] = useState<Record<string, number>>({}) // playerId -> position (0=attended)

  // New player
  const [newPlayerName, setNewPlayerName] = useState('')

  // New season
  const [newSeasonName, setNewSeasonName] = useState('')
  const [newSeasonYear, setNewSeasonYear] = useState(new Date().getFullYear())

  // Hall of fame
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

  async function logout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  // --- Register tournament results ---
  async function submitTournament() {
    if (!selSeason || !tournName || !tournDate) return flash('⚠ Completa todos los campos del torneo')
    const participants = Object.keys(results)
    if (participants.length === 0) return flash('⚠ Selecciona al menos un participante')

    const { data: tourn, error: te } = await supabase
      .from('tournaments')
      .insert({ season_id: selSeason, name: tournName, date: tournDate })
      .select().single()
    if (te) return flash('Error al crear torneo: ' + te.message)

    const rows = participants.map(pid => ({
      tournament_id: tourn.id,
      player_id: pid,
      position: results[pid],
      points_earned: getPointsForPosition(results[pid]),
    }))

    const { error: re } = await supabase.from('tournament_results').insert(rows)
    if (re) return flash('Error al registrar resultados: ' + re.message)

    setTournName(''); setResults({})
    setTournDate(new Date().toISOString().split('T')[0])
    loadData()
    flash('✅ Torneo registrado exitosamente')
  }

  // --- Add player ---
  async function addPlayer() {
    if (!newPlayerName.trim()) return
    const { error } = await supabase.from('players').insert({ name: newPlayerName.trim() })
    if (error) return flash('Error: ' + error.message)
    setNewPlayerName(''); loadData(); flash('✅ Jugador agregado')
  }

  // --- Add season ---
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

  // --- Registrations ---
  async function approveRegistration(id: string, fullName: string) {
    // Add to players table
    const { error: pe } = await supabase.from('players').insert({ name: fullName })
    if (pe) return flash('Error al agregar jugador: ' + pe.message)
    // Mark as approved
    await supabase.from('registrations').update({ status: 'approved' }).eq('id', id)
    loadData()
    flash('✅ Jugador aprobado y agregado a la liga')
  }

  async function rejectRegistration(id: string) {
    await supabase.from('registrations').update({ status: 'rejected' }).eq('id', id)
    loadData()
    flash('✅ Inscripción rechazada')
  }

  // --- Hall of fame ---
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

  const tabStyle = (t: Tab) => ({
    fontFamily: 'var(--font-display)',
    fontSize: '0.6rem',
    letterSpacing: '0.15em',
    padding: '0.7rem 1.2rem',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: tab === t ? 'var(--holo-warn)' : 'var(--text-dim)',
    borderBottom: tab === t ? '2px solid var(--holo-warn)' : '2px solid transparent',
    transition: 'all 0.2s',
  })

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--text-dim)' }}>
      CARGANDO PANEL...
    </div>
  )

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.3em', color: 'var(--holo-warn)', marginBottom: '0.25rem' }}>PANEL DE CONTROL</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--holo-warn)', textShadow: '0 0 20px rgba(255,170,0,0.3)' }}>ADMINISTRACIÓN IMPERIAL</h1>
        </div>
        <button onClick={logout} className="holo-btn" style={{ borderColor: 'var(--holo-danger)', color: 'var(--holo-danger)' }}>SALIR</button>
      </div>

      {/* Flash message */}
      {msg && (
        <div style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em', color: msg.startsWith('✅') ? 'var(--holo-accent)' : 'var(--holo-danger)', border: `1px solid ${msg.startsWith('✅') ? 'rgba(0,255,204,0.3)' : 'rgba(255,51,102,0.3)'}`, background: msg.startsWith('✅') ? 'rgba(0,255,204,0.05)' : 'rgba(255,51,102,0.05)' }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', marginBottom: '2rem' }}>
        {([['tournament', '⚔ TORNEO'], ['players', '👤 JUGADORES'], ['seasons', '📅 TEMPORADAS'], ['hof', '🏆 HALL OF FAME'], ['registrations', `📋 INSCRIPCIONES${registrations.filter(r => r.status === 'pending').length > 0 ? ` (${registrations.filter(r => r.status === 'pending').length})` : ''}`]] as [Tab, string][]).map(([t, label]) => (
          <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {/* TOURNAMENT TAB */}
      {tab === 'tournament' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="holo-card" style={{ padding: '1.75rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--holo-primary)', marginBottom: '1.25rem' }}>REGISTRAR TORNEO SEMANAL</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>TEMPORADA</label>
                <select className="holo-select" value={selSeason} onChange={e => setSelSeason(e.target.value)}>
                  {seasons.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>NOMBRE DEL TORNEO</label>
                <input className="holo-input" placeholder="Semana 1, Torneo enero..." value={tournName} onChange={e => setTournName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>FECHA</label>
                <input type="date" className="holo-input" value={tournDate} onChange={e => setTournDate(e.target.value)} />
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>RESULTADOS DE JUGADORES</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {players.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: results[p.id] !== undefined ? 'rgba(0,212,255,0.05)' : 'transparent', border: `1px solid ${results[p.id] !== undefined ? 'var(--border-dim)' : 'transparent'}`, borderRadius: '2px' }}>
                  <input
                    type="checkbox"
                    checked={results[p.id] !== undefined}
                    onChange={e => {
                      setResults(prev => {
                        const n = { ...prev }
                        if (e.target.checked) n[p.id] = 0
                        else delete n[p.id]
                        return n
                      })
                    }}
                    style={{ accentColor: 'var(--holo-primary)', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', flex: 1, color: results[p.id] !== undefined ? 'var(--text-primary)' : 'var(--text-dim)' }}>{p.name}</span>
                  {results[p.id] !== undefined && (
                    <select
                      className="holo-select"
                      value={results[p.id]}
                      onChange={e => setResults(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                      style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                    >
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

            {/* Preview */}
            {Object.keys(results).length > 0 && (
              <div style={{ padding: '1rem', background: 'rgba(0,212,255,0.03)', border: '1px solid var(--border-dim)', marginBottom: '1rem', borderRadius: '2px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>RESUMEN</div>
                {Object.entries(results).map(([pid, pos]) => {
                  const player = players.find(p => p.id === pid)
                  return (
                    <div key={pid} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>{player?.name}</span>
                      <span>{getPositionLabel(pos)} — <strong style={{ color: 'var(--holo-primary)' }}>{getPointsForPosition(pos)}pt</strong></span>
                    </div>
                  )
                })}
              </div>
            )}

            <button className="holo-btn" onClick={submitTournament} style={{ padding: '0.8rem 2rem' }}>
              REGISTRAR TORNEO
            </button>
          </div>

          {/* Recent tournaments */}
          {tournaments.length > 0 && (
            <div className="holo-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--text-dim)', marginBottom: '1rem' }}>TORNEOS RECIENTES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tournaments.slice(0, 8).map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-dim)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>{t.name}</span>
                    <span style={{ color: 'var(--text-dim)' }}>{new Date(t.date).toLocaleDateString('es-CL')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PLAYERS TAB */}
      {tab === 'players' && (
        <div className="holo-card" style={{ padding: '1.75rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--holo-primary)', marginBottom: '1.25rem' }}>GESTIÓN DE JUGADORES</div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <input className="holo-input" placeholder="Nombre del jugador..." value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPlayer()} />
            <button className="holo-btn" onClick={addPlayer} style={{ whiteSpace: 'nowrap' }}>AGREGAR</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {players.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-surface)', borderRadius: '2px', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-dim)', width: '24px' }}>#{i + 1}</span>
                  <span>{p.name}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--text-dim)' }}>
                  {new Date(p.created_at).toLocaleDateString('es-CL')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEASONS TAB */}
      {tab === 'seasons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="holo-card" style={{ padding: '1.75rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--holo-primary)', marginBottom: '1.25rem' }}>CREAR TEMPORADA</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'end' }}>
              <div>
                <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>NOMBRE</label>
                <input className="holo-input" placeholder="Temporada 1, Liga Primavera..." value={newSeasonName} onChange={e => setNewSeasonName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>AÑO</label>
                <input type="number" className="holo-input" value={newSeasonYear} onChange={e => setNewSeasonYear(Number(e.target.value))} style={{ width: '100px' }} />
              </div>
              <button className="holo-btn" onClick={addSeason}>CREAR</button>
            </div>
          </div>

          <div className="holo-card" style={{ padding: '1.75rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--text-dim)', marginBottom: '1rem' }}>TEMPORADAS EXISTENTES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {seasons.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-surface)', borderRadius: '2px', border: s.is_active ? '1px solid rgba(0,255,204,0.3)' : '1px solid transparent' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-primary)' }}>{s.name}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--text-dim)' }}>{s.year}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {s.is_active && <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--holo-accent)', border: '1px solid var(--holo-accent)', padding: '0.2rem 0.5rem' }}>ACTIVA</span>}
                    {!s.is_active && <button className="holo-btn" onClick={() => setActiveSeason(s.id)} style={{ fontSize: '0.5rem', padding: '0.4rem 0.8rem' }}>ACTIVAR</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HALL OF FAME TAB */}
      {tab === 'hof' && (
        <div className="holo-card" style={{ padding: '1.75rem', border: '1px solid rgba(255,215,0,0.2)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--holo-gold)', marginBottom: '1.25rem' }}>AGREGAR AL HALL DE LA FAMA</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>TEMPORADA</label>
              <select className="holo-select" value={hofSeason} onChange={e => setHofSeason(e.target.value)}>
                <option value="">Seleccionar temporada...</option>
                {seasons.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>CAMPEÓN</label>
              <select className="holo-select" value={hofPlayer} onChange={e => setHofPlayer(e.target.value)}>
                <option value="">Seleccionar jugador...</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>FOTO DEL CAMPEÓN</label>
              <input type="file" accept="image/*" onChange={e => setHofPhoto(e.target.files?.[0] || null)} style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '0.85rem' }} />
            </div>
            <button className="holo-btn" onClick={submitHof} style={{ alignSelf: 'flex-start', padding: '0.8rem 2rem', borderColor: 'var(--holo-gold)', color: 'var(--holo-gold)' }}>
              CONSAGRAR CAMPEÓN
            </button>
          </div>
        </div>
      )}

      {/* REGISTRATIONS TAB */}
      {tab === 'registrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {registrations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--text-dim)' }}>
              SIN INSCRIPCIONES AÚN
            </div>
          ) : (
            <>
              {/* Pending */}
              {registrations.filter(r => r.status === 'pending').length > 0 && (
                <div className="holo-card" style={{ padding: '1.5rem' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--holo-warn)', marginBottom: '1rem' }}>
                    PENDIENTES ({registrations.filter(r => r.status === 'pending').length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {registrations.filter(r => r.status === 'pending').map(r => (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,170,0,0.04)', border: '1px solid rgba(255,170,0,0.15)', borderRadius: '2px' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>{r.full_name}</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                            @{r.melegg_username} · {new Date(r.created_at).toLocaleDateString('es-CL')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="holo-btn"
                            onClick={() => approveRegistration(r.id, r.full_name)}
                            style={{ borderColor: 'var(--holo-accent)', color: 'var(--holo-accent)', fontSize: '0.55rem', padding: '0.4rem 0.9rem' }}
                          >
                            ✓ APROBAR
                          </button>
                          <button
                            className="holo-btn"
                            onClick={() => rejectRegistration(r.id)}
                            style={{ borderColor: 'var(--holo-danger)', color: 'var(--holo-danger)', fontSize: '0.55rem', padding: '0.4rem 0.9rem' }}
                          >
                            ✕ RECHAZAR
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processed */}
              {registrations.filter(r => r.status !== 'pending').length > 0 && (
                <div className="holo-card" style={{ padding: '1.5rem' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                    PROCESADAS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {registrations.filter(r => r.status !== 'pending').map(r => (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-surface)', borderRadius: '2px' }}>
                        <div>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{r.full_name}</span>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--text-dim)', marginLeft: '0.75rem' }}>@{r.melegg_username}</span>
                        </div>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.5rem',
                          letterSpacing: '0.15em',
                          color: r.status === 'approved' ? 'var(--holo-accent)' : 'var(--holo-danger)',
                          border: `1px solid ${r.status === 'approved' ? 'rgba(0,255,204,0.3)' : 'rgba(255,51,102,0.3)'}`,
                          padding: '0.2rem 0.5rem',
                        }}>
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
