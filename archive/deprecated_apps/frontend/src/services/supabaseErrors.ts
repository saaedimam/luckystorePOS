export async function getEdgeFunctionErrorMessage(
  error: unknown,
  fallback = 'Edge Function request failed',
) {
  if (error instanceof Error && error.message && !error.message.includes('non-2xx')) {
    return error.message
  }

  const maybeContext = error as { context?: unknown }
  const response = maybeContext?.context instanceof Response ? maybeContext.context : undefined

  if (!response) {
    return error instanceof Error && error.message ? error.message : fallback
  }

  try {
    const raw = await response.text()
    if (!raw) return `${fallback} (HTTP ${response.status})`

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const message =
        (typeof parsed.error === 'string' && parsed.error) ||
        (typeof parsed.message === 'string' && parsed.message) ||
        (typeof parsed.msg === 'string' && parsed.msg) ||
        raw
      return `${message} (HTTP ${response.status})`
    } catch {
      return `${raw} (HTTP ${response.status})`
    }
  } catch {
    return `${fallback} (HTTP ${response.status})`
  }
}
