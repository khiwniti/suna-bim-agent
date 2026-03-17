import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv, hasSupabaseEnv } from './config'

export function createClient() {
  const { url, anonKey } = getSupabaseEnv()

  if (!hasSupabaseEnv) {
    if (typeof window === 'undefined') {
      return createBrowserClient(url, anonKey)
    }

    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
  }

  return createBrowserClient(
    url,
    anonKey
  )
}
