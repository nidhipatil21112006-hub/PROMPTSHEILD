import { useState, useEffect } from 'react'
import './App.css'
import Scanner from './pages/Scanner.jsx'
import TestLab from './pages/TestLab.jsx'
import Policies from './pages/Policies.jsx'
import AuditLogs from './pages/AuditLogs.jsx'

const pages = [
  { id: 'overview', label: 'Overview' },
  { id: 'scanner', label: 'Prompt Scanner' },
  { id: 'lab', label: 'Test Lab' },
  { id: 'policies', label: 'Policy Settings' },
  { id: 'audit', label: 'Audit Logs' },
]

const sample = 'Sample interface data · not connected to backend'

function Motif() {
  return (
    <div className="motif" aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <div className="motif-core">
        <svg viewBox="0 0 100 112">
          <path d="M50 5 91 20v30c0 26-17 46-41 57C26 96 9 76 9 50V20L50 5Z" />
          <path d="M50 25 73 33v17c0 15-9 26-23 34-14-8-23-19-23-34V33l23-8Z" />
          <circle cx="50" cy="52" r="5" />
        </svg>
      </div>
      <span className="motif-label label-a">INPUT / 01</span>
      <span className="motif-label label-b">SECURE CORE</span>
      <span className="motif-dot" />
    </div>
  )
}

function Badge({ children, tone = 'gold' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

function Stat({ label, value, note, mark }) {
  return (
    <article className="stat panel">
      <span className="stat-mark">{mark}</span>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </article>
  )
}

function Overview({ navigate }) {
  return (
    <>
      <section className="hero panel">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> PROMPT SECURITY / CONTROL ROOM
          </div>
          <h1>
            Clarity between<br />the prompt and <i>the model.</i>
          </h1>
          <p>
            Inspect incoming content. Keep trusted instructions intact. Give every AI interaction a safer place to begin.
          </p>
          <button type="button" className="button button-gold" onClick={() => navigate('scanner')}>
            Open prompt scanner <span>↗</span>
          </button>
          <div className="hero-foot">
            <span>01 — INSPECT</span>
            <span>02 — DECIDE</span>
            <span>03 — PROTECT</span>
          </div>
        </div>
        <div className="hero-art">
          <Motif />
          <div className="art-caption">
            <span>PROTECTION LAYER</span>
            <b>ACTIVE / PREVIEW</b>
          </div>
        </div>
        <div className="hero-index">P—01</div>
      </section>

      <div className="section-label">
        <span>AT A GLANCE</span>
        <span>{sample}</span>
      </div>

      <section className="stats-grid">
        <Stat mark="↗" label="Requests scanned" value="—" note="Awaiting backend connection" />
        <Stat mark="⌁" label="Threats detected" value="—" note="No live data available" />
        <Stat mark="◉" label="Items to review" value="—" note="No live data available" />
        <Stat mark="◇" label="Active policies" value="—" note="Configuration preview" />
      </section>

      <section className="overview-lower">
        <div className="panel activity-panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">OBSERVATION DECK</div>
              <h2>Recent activity</h2>
            </div>
            <Badge>Preview</Badge>
          </div>
          <div className="empty-state">
            <span className="empty-glyph">⌁</span>
            <b>No activity to display</b>
            <p>Audit events will appear here when the backend is connected.</p>
          </div>
        </div>
        <div className="panel status-panel">
          <div className="eyebrow">SYSTEM POSTURE</div>
          <h2>Ready for connection</h2>
          <p>The interface is prepared for FastAPI security service.</p>
          <div className="status-row"><span className="status-orb" />Frontend available<Badge tone="muted">LOCAL</Badge></div>
          <div className="status-row"><span className="status-orb" />Decision engine<Badge tone="gold">ONLINE</Badge></div>
          <div className="status-row"><span className="status-orb" />Audit stream<Badge tone="gold">ONLINE</Badge></div>
        </div>
      </section>
    </>
  )
}

export default function App() {
  const getInitialPage = () => {
    const hash = window.location.hash.replace('#', '')
    return pages.some((p) => p.id === hash) ? hash : 'overview'
  }

  const [active, setActive] = useState(getInitialPage)

  const navigate = (id) => {
    window.location.hash = id
    setActive(id)
  }

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (pages.some((p) => p.id === hash)) {
        setActive(hash)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--espresso, #16100c)', color: 'var(--ivory, #f5f2eb)' }}>
      {/* Top Horizontal Navigation Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          height: '68px',
          borderBottom: '1px solid var(--line, rgba(213, 206, 163, 0.12))',
          background: 'rgba(26, 18, 12, 0.95)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Brand Left */}
        <button
          type="button"
          onClick={() => navigate('overview')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'inherit',
          }}
        >
          <div style={{ width: '28px', height: '32px' }}>
            <svg viewBox="0 0 40 44" style={{ width: '100%', height: '100%', fill: 'none', stroke: 'var(--gold, #d5cea3)', strokeWidth: 1.5 }}>
              <path d="M20 2 37 8v12c0 11-7 18-17 22C10 38 3 31 3 20V8L20 2Z" />
              <path d="M20 11 29 14v7c0 6-4 10-9 13-5-3-9-7-9-13v-7l9-3Z" />
            </svg>
          </div>
          <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
            <div style={{ fontSize: '13px', letterSpacing: '0.15em', fontWeight: 600 }}>
              PROMPT<b style={{ color: 'var(--gold, #d5cea3)' }}>SHIELD</b>
            </div>
            <div style={{ fontSize: '8px', letterSpacing: '0.18em', color: '#978d75', marginTop: '2px' }}>
              SECURITY WORKSPACE
            </div>
          </div>
        </button>

        {/* Center Nav Tabs */}
        <nav style={{ display: 'flex', gap: '32px', height: '100%' }}>
          {pages.map((p) => {
            const isActive = active === p.id
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => navigate(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--gold, #d5cea3)' : '2px solid transparent',
                  padding: '0 4px',
                  color: isActive ? 'var(--gold, #d5cea3)' : '#b7ad94',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                  height: '100%',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </nav>

        {/* Topbar Right Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', letterSpacing: '0.1em', color: '#b7ad94' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7bed9f', boxShadow: '0 0 8px #7bed9f' }} />
            PROXY ACTIVE
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingLeft: '16px',
              borderLeft: '1px solid rgba(213, 206, 163, 0.15)',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '3px',
                background: 'rgba(213, 206, 163, 0.15)',
                border: '1px solid rgba(213, 206, 163, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--gold, #d5cea3)',
              }}
            >
              P
            </div>
            <div style={{ lineHeight: '1.2', fontSize: '11px' }}>
              <div style={{ fontWeight: 600, color: 'var(--ivory, #f5f2eb)' }}>Local workspace</div>
              <div style={{ fontSize: '9px', color: '#978d75' }}>Security Gateway</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Content */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '36px 32px 64px' }}>
        {active === 'overview' && <div className="page-view"><Overview navigate={navigate} /></div>}
        {active === 'scanner' && <div className="page-view"><Scanner /></div>}
        {active === 'lab' && <div className="page-view"><TestLab /></div>}
        {active === 'policies' && <div className="page-view"><Policies /></div>}
        {active === 'audit' && <div className="page-view"><AuditLogs /></div>}

        <footer style={{ marginTop: '64px', paddingTop: '24px', borderTop: '1px solid var(--line, rgba(213, 206, 163, 0.1))', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#978d75', letterSpacing: '0.08em' }}>
          <span>© PROMPTSHIELD / GATEWAY ACTIVE</span>
          <span>SECURITY STARTS WITH CLARITY ✳</span>
        </footer>
      </main>
    </div>
  )
}