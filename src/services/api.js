/**
 * Prompt scan wiring is intentionally opt-in until the Flask team confirms its
 * route and payload contract. The request shape and response fields below are
 * provisional and must be aligned with the backend before integration.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const PROMPT_SCAN_ENDPOINT = import.meta.env.VITE_PROMPT_SCAN_ENDPOINT || ''

export function isScanConfigured() {
  return Boolean(API_BASE_URL && PROMPT_SCAN_ENDPOINT)
}

export class ApiError extends Error {
  constructor(message, kind = 'server') {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
  }
}

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL || !path) {
    throw new ApiError('The Flask scan endpoint is not configured. Confirm the endpoint and contract with the backend developer.', 'unavailable')
  }

  let response
  try {
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`
    const url = new URL(path, baseUrl)
    response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
  } catch {
    throw new ApiError('Could not reach the PromptShield backend. Check that it is running and the configured URL is correct.', 'unavailable')
  }
  if (!response.ok) {
    throw new ApiError(`The PromptShield backend returned an error (HTTP ${response.status}).`, 'server')
  }
  try {
    return await response.json()
  } catch {
    throw new ApiError('The backend response was not valid JSON.', 'invalid')
  }
}

export async function scanPrompt({ content, source }) {
  // Provisional payload: align these fields and source values with Flask before deployment.
  if (!isScanConfigured()) {
    throw new ApiError('The Flask scan endpoint is not configured. Confirm the endpoint and contract with the backend developer.', 'unavailable')
  }
  const response = await apiRequest(PROMPT_SCAN_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ content, source }),
  })
  if (!response || typeof response !== 'object' || Array.isArray(response) || !['ALLOW', 'BLOCK', 'SANITIZE', 'ESCALATE'].includes(response.decision) || typeof response.reason !== 'string' || !response.reason.trim()) {
    throw new ApiError('The backend response is missing a supported decision or reason. No security result can be shown.', 'invalid')
  }
  if (response.decision === 'SANITIZE' && (typeof response.sanitized_content !== 'string' || !response.sanitized_content.trim())) {
    throw new ApiError('The backend returned SANITIZE without sanitized content. No complete result can be shown.', 'invalid')
  }
  if (response.sanitized_content != null && typeof response.sanitized_content !== 'string') {
    throw new ApiError('The backend returned an invalid sanitized_content value.', 'invalid')
  }
  if (response.risk_indicators != null && (!Array.isArray(response.risk_indicators) || !response.risk_indicators.every(item => typeof item === 'string'))) {
    throw new ApiError('The backend returned invalid risk indicators.', 'invalid')
  }
  if (response.request_id != null && typeof response.request_id !== 'string') {
    throw new ApiError('The backend returned an invalid request ID.', 'invalid')
  }
  return { ...response, source }
}
