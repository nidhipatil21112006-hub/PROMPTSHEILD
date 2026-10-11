import { useState } from 'react'

const initialRules = [
  { id: 'instructions', group: 'TRUSTED INSTRUCTIONS', name: 'Instruction override attempts', description: 'Identify attempts to replace or supersede trusted system instructions.', scope: 'All sources', action: 'BLOCK', enabled: true },
  { id: 'documents', group: 'SOURCE TRUST', name: 'Document content trust', description: 'Treat uploaded and retrieved text as untrusted content for inspection.', scope: 'Documents', action: 'ESCALATE', enabled: true },
  { id: 'tools', group: 'SOURCE TRUST', name: 'Tool and retrieved content', description: 'Inspect tool output for embedded instructions before further use.', scope: 'Tool / retrieved content', action: 'ESCALATE', enabled: true },
  { id: 'protected', group: 'PROTECTED DATA', name: 'Protected value disclosure', description: 'Apply configured sensitive-data handling rules. No secret values are stored in this draft.', scope: 'All sources', action: 'BLOCK', enabled: true },
  { id: 'external', group: 'DATA TRANSFER', name: 'External transmission attempts', description: 'Review requests to disclose protected information outside the trusted context.', scope: 'All sources', action: 'ESCALATE', enabled: true },
]
const actions = ['ALLOW', 'BLOCK', 'SANITIZE', 'ESCALATE']
const sources = ['All sources', 'User Input', 'Uploaded Document', 'Tool/Retrieved Content']

export default function Policies() {
  const [rules, setRules] = useState(initialRules)
  const changed = rules.some((rule, index) => JSON.stringify(rule) !== JSON.stringify(initialRules[index]))
  const groups = [...new Set(rules.map(rule => rule.group))]

  function updateRule(id, field, value) {
    setRules(current => current.map(rule => rule.id === id ? { ...rule, [field]: value } : rule))
  }

  function discardDraft() { setRules(initialRules.map(rule => ({ ...rule }))) }

  return <>
    <header className="page-heading"><div><div className="eyebrow">CONFIGURATION / 03</div><h1>Policy settings</h1><p>Review and edit a local policy draft. These controls do not configure or enforce backend security.</p></div><span className="policy-state"><i/> BACKEND POLICY API: UNAVAILABLE</span></header>
    <div className="draft-banner"><span className="draft-indicator"/><div><b>{changed ? 'Unsaved draft changes' : 'Local draft preview'}</b><p>{changed ? 'Edits are held in this page only and have not been applied.' : 'Illustrative rules only. Nothing is loaded from or saved to the backend.'}</p></div><span className="draft-tag">NOT ENFORCED</span></div>
    <div className="policy-layout policy-v3"><div className="policy-main">{groups.map((group, groupIndex) => <section className="panel policy-group" key={group}><div className="policy-kicker"><span>0{groupIndex + 1} / {group}</span><Badge>LOCAL DRAFT</Badge></div>{rules.filter(rule => rule.group === group).map(rule => <article className="editable-rule" key={rule.id}><div className="editable-rule-top"><div><h2>{rule.name}</h2><p>{rule.description}</p></div><button type="button" className={`toggle ${rule.enabled ? 'on' : ''}`} role="switch" aria-checked={rule.enabled} aria-label={`Enable ${rule.name}`} onClick={() => updateRule(rule.id, 'enabled', !rule.enabled)}><span/></button></div><div className="rule-fields"><label>APPLIES TO<select value={rule.scope} onChange={event => updateRule(rule.id, 'scope', event.target.value)}>{sources.map(source => <option key={source}>{source}</option>)}</select></label><label>DECISION ACTION<select value={rule.action} onChange={event => updateRule(rule.id, 'action', event.target.value)}>{actions.map(action => <option key={action}>{action}</option>)}</select></label></div><div className="rule-enabled">DRAFT STATUS <b>{rule.enabled ? 'Enabled in draft' : 'Disabled in draft'}</b></div></article>)}</section>)}<section className="panel policy-group outcome-policy"><div className="policy-kicker"><span>06 / DECISION OUTCOMES</span><Badge>BACKEND CONTROLLED</Badge></div><p>Available decisions are displayed for reference. The backend remains authoritative.</p><div className="decision-list">{actions.map((action,index)=><div className="decision-row" key={action}><span className="decision-number">0{index + 1}</span><b className={`decision-text decision-${action.toLowerCase()}`}>{action}</b><span>{['Permit content','Reject content','Return modified content','Request human review'][index]}</span><span className="lock" aria-label="Backend controlled">◇</span></div>)}</div></section></div>
      <aside className="panel policy-aside policy-draft-aside"><div className="eyebrow">DRAFT CONTROLS</div><div className="aside-seal">◇</div><h2>{changed ? 'Changes pending' : 'No changes'}</h2><p>Draft edits stay in this app session and reset when the app reloads. They are not sent to the backend.</p><button className="button button-quiet" onClick={discardDraft} disabled={!changed}>Discard draft</button><button className="button button-gold save-disabled" disabled title="Backend policy read and update endpoints are not available">Save changes · unavailable</button><div className="aside-note">NO POLICY DATA IS PERSISTED</div></aside></div>
  </>
}

function Badge({ children }) { return <span className="badge badge-muted">{children}</span> }
