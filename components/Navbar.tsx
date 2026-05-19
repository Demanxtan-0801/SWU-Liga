'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const links = [
  { href: '/', label: 'Leaderboard' },
  { href: '/hall-of-fame', label: 'Hall de la Fama' },
  { href: '/inscripciones', label: 'Inscripción' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'linear-gradient(180deg, rgba(0,8,16,0.98) 0%, rgba(0,15,26,0.95) 100%)',
      borderBottom: '1px solid var(--border-dim)',
      backdropFilter: 'blur(12px)',
      padding: '0 1.25rem',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--holo-primary), var(--holo-accent), var(--holo-primary), transparent)', animation: 'pulse-glow 3s ease-in-out infinite' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '28px', height: '28px', border: '2px solid var(--holo-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow-sm)', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--holo-primary)">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', color: 'var(--holo-primary)', textShadow: 'var(--glow-sm)' }}>
              SWU<span style={{ color: 'var(--text-dim)', margin: '0 0.4rem' }}>|</span>LIGA LA QUINTA
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }} className="desktop-nav">
          {links.map(link => (
            <Link key={link.href} href={link.href} style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.5rem 1rem', color: pathname === link.href ? 'var(--holo-primary)' : 'var(--text-secondary)', borderBottom: pathname === link.href ? '2px solid var(--holo-primary)' : '2px solid transparent', transition: 'all 0.3s' }}>
              {link.label}
            </Link>
          ))}
          <Link href="/admin" style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.35rem 0.9rem', color: 'var(--holo-warn)', border: '1px solid rgba(255,170,0,0.3)', borderRadius: '2px', marginLeft: '0.5rem', transition: 'all 0.3s' }}>
            ⚙ Admin
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="mobile-menu-btn"
          style={{ background: 'none', border: '1px solid var(--border-dim)', color: 'var(--holo-primary)', padding: '0.4rem 0.6rem', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '0.9rem', borderRadius: '2px' }}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="mobile-nav" style={{ borderTop: '1px solid var(--border-dim)', paddingBottom: '1rem' }}>
          {links.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.85rem 0.5rem', color: pathname === link.href ? 'var(--holo-primary)' : 'var(--text-secondary)', borderBottom: '1px solid var(--border-dim)' }}>
              {link.label}
            </Link>
          ))}
          <Link href="/admin" onClick={() => setOpen(false)} style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.85rem 0.5rem', color: 'var(--holo-warn)', marginTop: '0.25rem' }}>
            ⚙ Admin
          </Link>
        </div>
      )}

      <style>{`
        .desktop-nav { display: flex; }
        .mobile-menu-btn { display: none; }
        .mobile-nav { display: block; }
        @media (min-width: 640px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-nav { display: none !important; }
        }
        @media (max-width: 639px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  )
}
