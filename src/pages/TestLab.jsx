import { useRef, useState } from 'react'
import { testCases } from '../data/testCases.js'
import { scanPrompt } from '../services/api.js'
import { calculateTestMetrics, didTestPass } from '../services/testMetrics.js'

const percent = value => value === 'N/A' ? value : value

export default function TestLab() {
  const [results, setResults] = useState({})
  const [errors, setErrors] = useState({})
  const [running, setRunning] = useState(false)
  const [currentId, setCurrentId] = useState('')
  const [progress, setProgress] = useState(0)
  const [notice, setNotice] = useState('')
  const lock = useRef(false)
  const metrics = calculateTestMetrics(testCases, results)
  const passedCount = testCases.filter(test => didTestPass(test, results[test.id])).length
  const failedCount = testCases.filter(test => results[test.id] && !didTestPass(test, results[test.id])).length
  const unavailableCount = Object.keys(errors).length

  async function runOne(test) {
    setCurrentId(test.id)
    setErrors(previous => ({ ...previous, [test.id]: '' }))
    setResults(previous => { const next = { ...previous }; delete next[test.id]; return next })
    try {
      const result = await scanPrompt({ content: test.input, source: test.source })
      setResults(previous => ({ ...previous, [test.id]: result }))
      return 'success'
    } catch (error) {
      setErrors(previous => ({ ...previous, [test.id]: error.message || 'Scan failed.' }))
      return error.kind === 'unavailable' ? 'unavailable' : 'failed'
    }
  }

  async function run(test = null) {
    if (lock.current) return
    lock.current = true
    setRunning(true)
    setNotice('')
    try {
      if (test) {
        setProgress(0)
        const succeeded = await runOne(test)
        setProgress(1)
        if (succeeded !== 'success') setNotice('This case did not produce a result. Check backend configuration and retry.')
      } else {
        setResults({})
        setErrors({})
        setProgress(0)
        let finished = 0
        let stoppedForUnavailableBackend = false
        for (const item of testCases) {
          const succeeded = await runOne(item)
          finished += 1
          setProgress(finished)
          if (succeeded === 'unavailable') {
            stoppedForUnavailableBackend = true
            break
          }
        }
        setNotice(stoppedForUnavailableBackend
          ? 'Suite stopped because the backend is unavailable. Only successful backend responses are included in the metrics.'
          : 'Suite run finished. Only successful backend responses are included in the metrics.')
      }
    } finally {
      setCurrentId('')
      setRunning(false)
      lock.current = false
    }
  }

  const formatted = value => percent(value)

  return <>
    <header className="page-heading"><div><div className="eyebrow">EVALUATION / 02</div><h1>Test lab</h1><p>Run fictional, labelled cases against the configured PromptShield scanner. Sample definitions are not test results.</p></div><button className="button button-gold" onClick={() => run()} disabled={running}>{running ? `Running ${progress}/${testCases.length}…` : <>Run full suite <span>→</span></>}</button></header>
    <div className="metrics-grid lab-metrics">
      <div className="panel metric"><span>TESTS EXECUTED</span><b>{metrics.total} / {testCases.length}</b><small>Validated backend decisions only</small></div>
      <div className="panel metric"><span>MALICIOUS DETECTION RATE</span><b>{formatted(metrics.detectionRate)}</b><small>{metrics.correctDetections} detected · {metrics.falseNegatives} false negatives</small></div>
      <div className="panel metric"><span>LEGITIMATE FALSE POSITIVE RATE</span><b>{formatted(metrics.falsePositiveRate)}</b><small>{metrics.falsePositives} blocked or escalated</small></div>
      <div className="panel metric"><span>OVERALL ACCURACY</span><b>{formatted(metrics.accuracy)}</b><small>Exact expected-decision matches</small></div>
    </div>
    <div className="execution-summary" aria-live="polite"><span>DEFINED <b>{testCases.length}</b></span><span>EXECUTED <b>{metrics.total}</b></span><span>PASSED <b className="summary-good">{passedCount}</b></span><span>FAILED <b className="summary-bad">{failedCount}</b></span><span>COULD NOT EXECUTE <b>{unavailableCount}</b></span></div>
    <section className="panel table-panel test-library"><div className="panel-title"><div><div className="eyebrow">FICTIONAL CASE LIBRARY</div><h2>Evaluation set <span className="count">{testCases.length} CASES</span></h2></div><span className="badge">Live results: {metrics.total}</span></div>
      {running && <div className="suite-progress" role="status"><div className="progress-copy"><span>SUITE IN PROGRESS</span><b>{progress} / {testCases.length}</b></div><div className="progress-track"><span style={{ width: `${(progress / testCases.length) * 100}%` }}/></div></div>}
      {notice && <p className="lab-notice" role="status">{notice}</p>}
      <div className="test-case-list">{testCases.map(test => {
        const result = results[test.id]
        const failed = errors[test.id]
        const pass = didTestPass(test, result)
        return <article className="test-case" key={test.id}>
          <div className="case-main"><div className="case-id">{test.id}<span className={`badge ${test.classification === 'MALICIOUS' ? 'badge-risk' : 'badge-safe'}`}>{test.classification}</span></div><h3>{test.name}</h3><p>{test.evaluates}</p><div className="case-meta">SOURCE <b>{test.source}</b><span>EXPECTED <b><span className={`decision-text decision-${test.expected.toLowerCase()}`}>{test.expected}</span></b></span></div><details><summary>View fictional test input</summary><pre>{test.input}</pre></details></div>
          <div className="case-result"><span className="result-column-label">ACTUAL</span>{result ? <><span className={`decision-text decision-${result.decision.toLowerCase()}`}>{result.decision}</span><span className={`test-pass ${pass?'':'test-fail'}`}>{pass ? 'PASS' : 'MISMATCH'}</span>{!pass && <small>Expected {test.expected}, received {result.decision}.</small>}</> : failed ? <><span className="case-error-label">UNAVAILABLE</span><small>{failed}</small></> : <span className="case-not-run">Not run</span>}<button className="button button-quiet run-case" onClick={() => run(test)} disabled={running}>{currentId === test.id ? 'Running…' : result || failed ? 'Rerun case' : 'Run case'}</button></div>
        </article>
      })}</div>
      <p className="metric-method">Detection: malicious BLOCK/ESCALATE counts as detected; SANITIZE is correct only when explicitly expected. False positives are legitimate BLOCK/ESCALATE outcomes. Metrics use completed cases only.</p>
    </section>
  </>
}
