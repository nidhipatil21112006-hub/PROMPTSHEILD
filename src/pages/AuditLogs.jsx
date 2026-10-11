import { useState } from 'react'

const outcomes = ['ALLOW', 'BLOCK', 'SANITIZE', 'ESCALATE']
const sources = ['User Input', 'Uploaded Document', 'Tool/Retrieved Content']

export default function AuditLogs() {
  const [outcome, setOutcome] = useState('ALL')
  const [source, setSource] = useState('ALL')
  const [search, setSearch] = useState('')
  const hasFilters = outcome !== 'ALL' || source !== 'ALL' || search.trim() !== ''

  function clearFilters() {
    setOutcome('ALL')
    setSource('ALL')
    setSearch('')
  }

  return <>
    <header className="page-heading"><div><div className="eyebrow">OBSERVABILITY / 04</div><h1>Audit logs</h1><p>Review traceable metadata for security decisions returned by PromptShield.</p></div><span className="policy-state"><i/> AUDIT API: UNAVAILABLE</span></header>
    <section className="panel audit-panel audit-v3"><div className="audit-toolbar"><div><div className="eyebrow">EVENT HISTORY</div><h2>Audit trail <span className="badge badge-muted">NO LIVE DATA</span></h2><p>Audit records are not available until a backend history endpoint is connected.</p></div><button className="button button-quiet" disabled title="No audit records are available">Export unavailable</button></div>
      <div className="audit-filterbar"><label className="audit-search"><span>SEARCH METADATA</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Request ID or reason" aria-label="Search audit metadata"/></label><label><span>DECISION</span><select value={outcome} onChange={event => setOutcome(event.target.value)}><option value="ALL">All decisions</option>{outcomes.map(value => <option key={value}>{value}</option>)}</select></label><label><span>SOURCE</span><select value={source} onChange={event => setSource(event.target.value)}><option value="ALL">All sources</option>{sources.map(value => <option key={value}>{value}</option>)}</select></label><button className="button button-quiet" onClick={clearFilters} disabled={!hasFilters}>Clear filters</button></div>
      <div className="table-wrap audit-table-v3"><table><thead><tr><th>TIMESTAMP</th><th>REQUEST ID</th><th>SOURCE</th><th>DECISION</th><th>REASON</th><th>RISK INDICATORS</th><th>SANITIZED</th></tr></thead><tbody><tr><td colSpan="7" className="audit-no-records">{hasFilters ? 'No records match the selected filters. The audit API is not connected.' : 'No audit records are available. Records will appear after the backend history API is connected.'}</td></tr></tbody></table></div>
      <div className="audit-empty audit-empty-v3"><span>≡</span><b>{hasFilters ? 'No matching events' : 'Audit history is unavailable'}</b><p>{hasFilters ? 'Clear filters or connect the backend to search real records.' : 'No records have been fabricated or stored in the frontend.'}</p></div><div className="audit-footer"><span>0 RECORDS</span><span>Pagination will be available when supported by the backend.</span></div>
    </section>
  </>
}
