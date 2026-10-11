/** Calculate metrics only from completed records with a validated decision. */
export function calculateTestMetrics(testCases, results) {
  const completed = testCases
    .map(test => ({ test, actual: results[test.id]?.decision }))
    .filter(row => row.actual)
  const malicious = completed.filter(row => row.test.classification === 'MALICIOUS')
  const legitimate = completed.filter(row => row.test.classification === 'LEGITIMATE')
  const correct = completed.filter(row => row.actual === row.test.expected).length
  const detected = malicious.filter(({ test, actual }) =>
    actual === 'BLOCK' || actual === 'ESCALATE' || (test.expected === 'SANITIZE' && actual === 'SANITIZE'),
  ).length
  const falsePositives = legitimate.filter(({ actual }) => actual === 'BLOCK' || actual === 'ESCALATE').length
  const falseNegatives = malicious.filter(({ actual }) => actual === 'ALLOW').length
  const rate = (numerator, denominator) => denominator ? `${((numerator / denominator) * 100).toFixed(1)}%` : 'N/A'

  return {
    total: completed.length,
    correctDetections: detected,
    falsePositives,
    falseNegatives,
    detectionRate: rate(detected, malicious.length),
    falsePositiveRate: rate(falsePositives, legitimate.length),
    accuracy: rate(correct, completed.length),
  }
}

export function didTestPass(test, result) {
  return Boolean(result && result.decision === test.expected)
}
