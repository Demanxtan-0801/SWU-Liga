'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Leaderboard' },
  { href: '/hall-of-fame', label: 'Hall de la Fama' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'linear-gradient(180deg, rgba(0,8,16,0.98) 0%, rgba(0,15,26,0.95) 100%)',
      borderBottom: '1px solid var(--border-dim)',
      backdropFilter: 'blur(12px)',
      padding: '0 2rem',
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, var(--holo-primary), var(--holo-accent), var(--holo-primary), transparent)',
        animation: 'pulse-glow 3s ease-in-out infinite',
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '2px solid var(--holo-primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--glow-sm)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--holo-primary)">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: 'var(--holo-primary)',
              textShadow: 'var(--glow-sm)',
            }}>
              SWU<span style={{ color: 'var(--text-dim)', margin: '0 0.5rem' }}>|</span>LIGA LA QUINTA
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.6rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '0.5rem 1.2rem',
                color: pathname === link.href ? 'var(--holo-primary)' : 'var(--text-secondary)',
                borderBottom: pathname === link.href ? '2px solid var(--holo-primary)' : '2px solid transparent',
                transition: 'all 0.3s',
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.6rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              padding: '0.4rem 1rem',
              color: 'var(--holo-warn)',
              border: '1px solid rgba(255,170,0,0.3)',
              borderRadius: '2px',
              marginLeft: '0.5rem',
              transition: 'all 0.3s',
            }}
          >
            ⚙ Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}
