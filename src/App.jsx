import { useState, useEffect } from 'react'
import './App.css'
import Scanner from './pages/Scanner.jsx'
import TestLab from './pages/TestLab.jsx'
import Policies from './pages/Policies.jsx'
import AuditLogs from './pages/AuditLogs.jsx'

const pages = [
  { id: 'overview', label: 'Overview', icon: '◫' },
  { id: 'scanner', label: 'Prompt scanner', icon: '⌕' },
  { id: 'lab', label: 'Test lab', icon: '⌘' },
  { id: 'policies', label: 'Policy settings', icon: '◇' },
  { id: 'audit', label: 'Audit logs', icon: '≡' },
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
    return pages.some((p) => p.id === hash) ? hash : 'scanner'
  }

  const [active, setActive] = useState(getInitialPage)
  const [mobileOpen, setMobileOpen] = useState(false)

  const current = pages.find((p) => p.id === active) || pages[1]

  const navigate = (id) => {
    window.location.hash = id
    setActive(id)
    setMobileOpen(false)
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
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <button
          type="button"
          className="brand"
          style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', width: '100%' }}
          onClick={() => navigate('overview')}
        >
          <span className="brand-mark">
            <svg viewBox="0 0 40 44">
              <path d="M20 2 37 8v12c0 11-7 18-17 22C10 38 3 31 3 20V8L20 2Z" />
              <path d="M20 11 29 14v7c0 6-4 10-9 13-5-3-9-7-9-13v-7l9-3Z" />
            </svg>
          </span>
          <span>PROMPT<b>SHIELD</b><small>SECURITY WORKSPACE</small></span>
        </button>

        <div className="sidebar-rule" />
        <div className="nav-label">WORKSPACE <span>01—05</span></div>

        <nav>
          {pages.map((p, i) => (
            <button
              type="button"
              key={p.id}
              className={`nav-item ${active === p.id ? 'active' : ''}`}
              aria-current={active === p.id ? 'page' : undefined}
              onClick={() => navigate(p.id)}
            >
              <span className="nav-icon">{p.icon}</span>
              <span>{p.label}</span>
              <span className="nav-number">0{i + 1}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-decoration">
            <span className="tiny-orbit" /> <span>TRUST, BY DESIGN</span>
          </div>
          <div className="workspace-user">
            <span className="avatar">P</span>
            <span><b>Local workspace</b><small>Security Gateway</small></span>
            <span className="more">···</span>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <div className="topbar">
          <button
            type="button"
            className="menu-button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <div className="breadcrumbs">
            PROMPTSHIELD <span>/</span> <b>{current.label.toUpperCase()}</b>
          </div>
          <div className="topbar-right">
            <span className="environment"><i /> PROXY ACTIVE</span>
            <span className="topbar-divider" />
            <button type="button" className="icon-button" aria-label="Help" title="Help">?</button>
          </div>
        </div>

        <main className="page-content">
          {active === 'overview' && <div className="page-view"><Overview navigate={navigate} /></div>}
          {active === 'scanner' && <div className="page-view"><Scanner /></div>}
          {active === 'lab' && <div className="page-view"><TestLab /></div>}
          {active === 'policies' && <div className="page-view"><Policies /></div>}
          {active === 'audit' && <div className="page-view"><AuditLogs /></div>}

          <footer className="footer">
            <span>© PROMPTSHIELD <span className="footer-dot">/</span> GATEWAY ACTIVE</span>
            <span>SECURITY STARTS WITH CLARITY <span className="footer-star">✳</span></span>
          </footer>
        </main>
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}
    </div>
  )
}