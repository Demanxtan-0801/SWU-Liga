'use client'
export const dynamic = 'force-dynamic'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const router = useRouter()
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/admin/dashboard')
      else router.push('/admin/login')
    })
  }, [router])
  return (
    <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--text-dim)' }}>
      REDIRIGIENDO...
    </div>
  )
}
