import { supabase } from './supabase'
import { getEdgeFunctionErrorMessage } from './supabaseErrors'

/** Refresh if the access token expires within this many seconds (gateway returns 401 on expiry). */
const ACCESS_TOKEN_REFRESH_BUFFER_SEC = 90

async function getAccessTokenForEdgeFunctions(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('You are not signed in. Please log in again.')
  }

  const exp = session.expires_at
  const nowSec = Math.floor(Date.now() / 1000)
  const needsRefresh = exp != null && exp <= nowSec + ACCESS_TOKEN_REFRESH_BUFFER_SEC

  if (needsRefresh) {
    const { data, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !data.session?.access_token) {
      throw new Error('Session expired. Please log in again.')
    }
    return data.session.access_token
  }

  return session.access_token
}

function isInvalidJwtError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown })?.message === 'string'
        ? (error as { message: string }).message
        : ''

  if (message.toLowerCase().includes('invalid jwt')) return true

  const maybeContext = error as { context?: unknown }
  const response = maybeContext?.context instanceof Response ? maybeContext.context : undefined
  return response?.status === 401
}

export async function invokeEdgeFunction<TResponse = unknown>(
  functionName: string,
  body: unknown,
  fallbackErrorMessage: string,
): Promise<TResponse> {
  const accessToken = await getAccessTokenForEdgeFunctions()

  const firstTry = await supabase.functions.invoke<TResponse>(functionName, {
    body: body as never,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!firstTry.error) {
    if (firstTry.data == null) {
      throw new Error(`${fallbackErrorMessage}: empty response`)
    }
    return firstTry.data
  }

  if (isInvalidJwtError(firstTry.error)) {
    const { data, error: refreshError } = await supabase.auth.refreshSession()
    if (!refreshError && data.session?.access_token) {
      const secondTry = await supabase.functions.invoke<TResponse>(functionName, {
        body: body as never,
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      })
      if (!secondTry.error) {
        if (secondTry.data == null) {
          throw new Error(`${fallbackErrorMessage}: empty response`)
        }
        return secondTry.data
      }
      const secondMessage = await getEdgeFunctionErrorMessage(secondTry.error, fallbackErrorMessage)
      throw new Error(secondMessage)
    }
    throw new Error('Session expired. Please log in again.')
  }

  const firstMessage = await getEdgeFunctionErrorMessage(firstTry.error, fallbackErrorMessage)
  throw new Error(firstMessage)
}
