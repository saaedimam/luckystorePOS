type MetricPayload = {
  name: string
  valueMs: number
  meta?: Record<string, unknown>
  at: string
}

const METRICS_KEY = 'lucky-pos-metrics'
const MAX_METRICS = 100

export function trackMetric(name: string, valueMs: number, meta?: Record<string, unknown>) {
  const payload: MetricPayload = {
    name,
    valueMs: Math.max(0, Math.round(valueMs)),
    meta,
    at: new Date().toISOString(),
  }

  try {
    const current = localStorage.getItem(METRICS_KEY)
    const parsed = current ? (JSON.parse(current) as MetricPayload[]) : []
    const next = [...parsed.slice(-MAX_METRICS + 1), payload]
    localStorage.setItem(METRICS_KEY, JSON.stringify(next))
  } catch {
    // Metrics are best-effort and should never block app behavior.
  }

  console.info(`📊 ${name}: ${payload.valueMs}ms`, payload.meta ?? {})
}

