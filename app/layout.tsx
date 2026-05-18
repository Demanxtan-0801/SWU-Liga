import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'SWTCG Liga Imperial',
  description: 'Star Wars Trading Card Game — Liga de Torneo Semanal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <main style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </main>
        <footer style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.6rem',
          letterSpacing: '0.2em',
          borderTop: '1px solid var(--border-dim)',
          marginTop: '4rem',
          position: 'relative',
          zIndex: 1,
        }}>
          SWTCG LIGA IMPERIAL — LA FUERZA TE ACOMPAÑA
        </footer>
      </body>
    </html>
  )
}
