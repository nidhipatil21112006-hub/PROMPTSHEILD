import { useState } from 'react'
import { isScanConfigured, scanPrompt } from '../services/api.js'

const sources = ['User Input', 'Uploaded Document', 'Tool/Retrieved Content']
const decisions = ['ALLOW', 'BLOCK', 'SANITIZE', 'ESCALATE']

function Header({ eyebrow, title, text }) {
  return <header className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{text}</p></div><span className="scanner-connection"><i/> {isScanConfigured() ? 'SCAN ENDPOINT CONFIGURED' : 'SCAN ENDPOINT NOT CONFIGURED'}</span></header>
}

function OutcomeBadge({ decision }) {
  return <span className={`decision-badge decision-${decision.toLowerCase()}`}>{decision}</span>
}

export default function Scanner() {
  const [source, setSource] = useState(sources[0])
  const [content, setContent] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copyNotice, setCopyNotice] = useState('')
  const [validation, setValidation] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleScan(event) {
    event.preventDefault()
    if (loading) return
    if (!content.trim()) {
      setValidation('Enter some content before scanning.')
      setResult(null)
      setError('')
      return
    }
    setValidation('')
    setResult(null)
    setError('')
    setCopyNotice('')
    setLoading(true)
    try {
      setResult(await scanPrompt({ content, source }))
    } catch (requestError) {
      setError(requestError.message || 'The scan could not be completed.')
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setContent('')
    setResult(null)
    setError('')
    setValidation('')
    setCopyNotice('')
  }

  async function copySanitized() {
    try {
      await navigator.clipboard.writeText(result.sanitized_content)
      setCopyNotice('Sanitized text copied.')
    } catch {
      setCopyNotice('Clipboard access failed. Select and copy the sanitized text instead.')
    }
  }

  return <>
    <Header eyebrow="INSPECTION / 01" title="Prompt Scanner" text="Evaluate prompts and untrusted content before it reaches an AI model."/>
    <div className="scanner-layout">
      <form className="panel workspace" onSubmit={handleScan}>
        <div className="panel-title"><div><div className="eyebrow">INSPECTION WORKSPACE</div><h2>Incoming content</h2></div><span className="step-index">01 / 02</span></div>
        <div className="source-label" id="source-label">CONTENT SOURCE</div>
        <div className="source-options" role="group" aria-labelledby="source-label">{sources.map(item => <button type="button" key={item} className={`source-option ${source === item ? 'selected' : ''}`} aria-pressed={source === item} onClick={() => setSource(item)}>{item}<span>{source === item ? '●' : '○'}</span></button>)}</div>
        {source === 'Uploaded Document' && <p className="source-help">Paste document text below. File upload is not available in this version.</p>}
        <label className="source-label" htmlFor="prompt-input">PROMPT OR CONTENT</label>
        <textarea id="prompt-input" value={content} onChange={event => {setContent(event.target.value); if (validation) setValidation('')}} placeholder="Paste or type untrusted content for inspection…" aria-describedby="content-count scanner-feedback"/>
        <div className="workspace-bottom"><span id="content-count">{content.length.toLocaleString()} characters</span><div><button type="button" className="button button-quiet" onClick={handleClear} disabled={loading}>Clear</button><button type="submit" className="button button-gold" disabled={loading}>{loading ? <><span className="button-spinner"/> Scanning…</> : <>Scan input <span>→</span></>}</button></div></div>
        <p id="scanner-feedback" className={`inline-note ${validation ? 'feedback-error' : ''}`} role="status">{validation || (loading ? 'Waiting for the security service…' : 'Content is sent only to the configured PromptShield backend.')}</p>
      </form>
      <aside className="panel results-panel" aria-live="polite" aria-busy={loading}>
        <div className="eyebrow">INSPECTION RESULT</div><h2>Decision console</h2>
        {loading ? <div className="result-placeholder"><div className="result-ring scanning-ring">···</div><b>Inspecting content</b><p>Waiting for the configured security service.</p></div> : error ? <div className="scanner-error"><span>!</span><b>{error.includes('not configured') ? 'Backend unavailable' : 'Scan unsuccessful'}</b><p>{error}</p></div> : result ? <div className="scan-result"><div className="result-head"><OutcomeBadge decision={result.decision}/><span className="result-source">{result.source}</span></div><div className="result-detail"><span>DECISION REASON</span><p>{result.reason}</p></div>{result.risk_indicators?.length > 0 && <div className="result-detail"><span>RISK INDICATORS</span><ul>{result.risk_indicators.map((risk, index) => <li key={`${risk}-${index}`}>{risk}</li>)}</ul></div>}{result.request_id && <div className="result-detail"><span>REQUEST ID</span><b className="request-id">{result.request_id}</b></div>}{result.decision === 'SANITIZE' && <div className="sanitized-block"><div className="sanitized-heading"><span>SANITIZED CONTENT</span><button className="copy-button" type="button" onClick={copySanitized}>Copy text ↗</button></div><pre>{result.sanitized_content}</pre>{copyNotice && <p className="copy-notice" role="status">{copyNotice}</p>}</div>}</div> : <div className="result-placeholder"><div className="result-ring">···</div><b>Awaiting inspection</b><p>Backend decisions and supporting details appear here after a scan.</p></div>}
        <div className="outcome-grid">{decisions.map((item) => <div key={item} className={`outcome ${result?.decision === item ? 'outcome-active' : ''}`}><span>0{decisions.indexOf(item) + 1}</span>{item}</div>)}</div>
      </aside>
    </div>
  </>
}
