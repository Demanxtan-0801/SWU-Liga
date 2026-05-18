import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase env vars not set')
    _supabase = createClient(url, key)
  }
  return _supabase
}

// Lazy proxy so existing code using `supabase.from(...)` still works
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  }
})

export function getPointsForPosition(position: number): number {
  switch (position) {
    case 1: return 6  // Champion: 1 attendance + 5 bonus
    case 2: return 4  // Runner-up: 1 + 3
    case 3: return 3  // Top 3: 1 + 2
    case 4: return 2  // Top 4: 1 + 1
    default: return 1 // Just attended: 1
  }
}

export function getPositionLabel(position: number): string {
  switch (position) {
    case 1: return '🏆 Campeón'
    case 2: return '🥈 Finalista'
    case 3: return '🥉 Top 3'
    case 4: return '⚔️ Top 4'
    default: return '✅ Asistente'
  }
}
