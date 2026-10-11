/**
 * PromptShield FastAPI Integration Bridge
 * Connects Vite/React frontend to FastAPI on http://127.0.0.1:8000
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const PROMPT_SCAN_ENDPOINT = import.meta.env.VITE_PROMPT_SCAN_ENDPOINT || 'scan';

export function isScanConfigured() {
  return true;
}

export class ApiError extends Error {
  constructor(message, kind = 'server') {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
  }
}

export async function apiRequest(path, options = {}) {
  let response;
  try {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `${API_BASE_URL.replace(/\/+$/, '')}/${cleanPath}`;

    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    throw new ApiError(
      'Could not reach the PromptShield backend. Ensure FastAPI is running on port 8000.',
      'unavailable'
    );
  }

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.detail) {
        errorDetail = typeof errJson.detail === 'string'
          ? errJson.detail
          : JSON.stringify(errJson.detail);
      }
    } catch {
      // Use fallback errorDetail
    }
    throw new ApiError(`Backend error: ${errorDetail}`, 'server');
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError('The backend response was not valid JSON.', 'invalid');
  }
}

export async function scanPrompt({ content, source }) {
  const cleanContent = typeof content === 'string' ? content.trim() : '';
  if (!cleanContent) {
    throw new ApiError('Prompt content cannot be empty.', 'invalid');
  }

  // Map any incoming human-readable source to allowed backend literal
  const sourceStr = String(source || 'user').toLowerCase().trim();
  let normalizedSource = 'user';
  if (sourceStr.includes('doc') || sourceStr.includes('file')) {
    normalizedSource = 'document';
  } else if (sourceStr.includes('tool') || sourceStr.includes('retriev')) {
    normalizedSource = 'tool_output';
  } else if (sourceStr.includes('web')) {
    normalizedSource = 'webpage';
  }

  const payload = {
    content: cleanContent,
    source: normalizedSource,
    context: 'direct_input',
    protected_values: [],
  };

  const rawResponse = await apiRequest(PROMPT_SCAN_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const actionVerdict = rawResponse.action || rawResponse.decision || 'ALLOW';

  let formattedReason = 'No threats detected.';
  if (Array.isArray(rawResponse.reasons) && rawResponse.reasons.length > 0) {
    formattedReason = rawResponse.reasons.join('; ');
  } else if (typeof rawResponse.reason === 'string' && rawResponse.reason.trim()) {
    formattedReason = rawResponse.reason;
  }

  const indicators = Array.isArray(rawResponse.evidence)
    ? rawResponse.evidence
    : (Array.isArray(rawResponse.risk_indicators) ? rawResponse.risk_indicators : []);

  let sanitizedContent = rawResponse.sanitized_content != null
    ? String(rawResponse.sanitized_content)
    : null;

  if (actionVerdict === 'SANITIZE' && (!sanitizedContent || !sanitizedContent.trim())) {
    sanitizedContent = cleanContent;
  }

  return {
    request_id: rawResponse.request_id || `req_${Date.now()}`,
    decision: actionVerdict,
    action: actionVerdict,
    reason: formattedReason,
    reasons: Array.isArray(rawResponse.reasons) ? rawResponse.reasons : [formattedReason],
    risk_score: typeof rawResponse.risk_score === 'number' ? rawResponse.risk_score : 0.0,
    risk_indicators: indicators,
    evidence: indicators,
    sanitized_content: sanitizedContent,
    source: rawResponse.source || normalizedSource,
  };
}

// Helpers for Overview, Logs, and Policy UI views
export async function getHealth() {
  return apiRequest('health', { method: 'GET' });
}

export async function getLogs(limit = 50) {
  return apiRequest(`logs?limit=${limit}`, { method: 'GET' });
}

export async function getPolicy() {
  return apiRequest('policy', { method: 'GET' });
}

export async function updatePolicy(config, adminToken) {
  return apiRequest('policy', {
    method: 'PUT',
    body: JSON.stringify({
      config,
      admin_token: adminToken,
    }),
  });
}