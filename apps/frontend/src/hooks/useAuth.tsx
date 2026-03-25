/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../services/supabase'
import type {
  AuthUser as User,
  AuthSession as Session,
  PostgrestSingleResponse,
} from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'manager' | 'cashier' | 'stock'
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: string
  ) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isManager: boolean
  isCashier: boolean
  isStock: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from public.users table
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching user profile for auth_id:', userId)
      
      // Make the query directly - Supabase client handles session automatically
      const startTime = Date.now()
      console.log('📡 Making query to Supabase...')
      
      // Create a promise that will reject after 5 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Query timeout after 5 seconds'))
        }, 5000)
      })
      
      // Race the query against the timeout
      const queryPromise = supabase
        .from('users')
        .select('id, email, full_name, role')
        .eq('auth_id', userId)
        .maybeSingle()
      
      let result: PostgrestSingleResponse<UserProfile | null>
      try {
        result = await Promise.race([queryPromise, timeoutPromise])
      } catch {
        console.error('⏱️ Query timed out after 5 seconds')
        return null
      }
      
      const { data, error } = result
      const duration = Date.now() - startTime
      console.log(`⏱️ Query completed in ${duration}ms`)
      
      if (error) {
        console.error('❌ Error fetching user profile:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        if (error.code === 'PGRST116') {
          // No rows found
          console.warn('⚠️ User profile not found in users table (PGRST116). Auth ID:', userId)
        } else if (error.code === '42501') {
          // Permission denied - RLS issue
          console.error('🚫 Permission denied - RLS policy may be blocking the query')
        }
        return null
      }
      
      // If no profile found, return null
      if (!data) {
        console.warn('⚠️ User profile not found in users table. Auth ID:', userId)
        return null
      }
      
      console.log('✅ User profile fetched successfully:', data)
      return data as UserProfile
    } catch (error: unknown) {
      console.error('💥 Exception fetching user profile:', error)
      return null
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let initialLoadComplete = false

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted && !initialLoadComplete) {
        console.warn('Auth loading timeout - setting loading to false')
        setLoading(false)
        initialLoadComplete = true
      }
    }, 5000) // 5 second timeout

    // Get initial session
    console.log('Initializing auth - getting session...')
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return
      
      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        initialLoadComplete = true
        if (timeoutId) clearTimeout(timeoutId)
        return
      }
      
      console.log('Session check complete:', session ? 'Has session' : 'No session')
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('User found, fetching profile...', {
          userId: session.user.id,
          email: session.user.email
        })
        
        // Fetch profile - the function now has its own timeout
        fetchUserProfile(session.user.id)
          .then((profile) => {
            console.log('Profile fetch complete:', profile ? '✅ Profile found' : '❌ No profile')
            if (mounted) {
              setProfile(profile)
              setLoading(false)
              initialLoadComplete = true
              if (timeoutId) clearTimeout(timeoutId)
            }
          })
          .catch((err) => {
            console.error('Error fetching profile:', err)
            if (mounted) {
              setProfile(null)
              setLoading(false)
              initialLoadComplete = true
              if (timeoutId) clearTimeout(timeoutId)
            }
          })
      } else {
        // No session, no need to fetch profile
        console.log('No session, setting loading to false')
        setProfile(null)
        setLoading(false)
        initialLoadComplete = true
        if (timeoutId) clearTimeout(timeoutId)
      }
    }).catch((error) => {
      console.error('Error in getSession:', error)
      if (mounted) {
        setLoading(false)
        initialLoadComplete = true
        if (timeoutId) clearTimeout(timeoutId)
      }
    })

    // Listen for auth changes (only after initial load completes)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || !initialLoadComplete) {
        // Skip during initial load - we handle it with getSession above
        return
      }
      
      console.log('Auth state changed:', event, { hasSession: !!session, userId: session?.user?.id })
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        console.log('🔄 Auth change: Fetching profile for user:', session.user.id)
        // Use a timeout wrapper to prevent hanging
        const profilePromise = fetchUserProfile(session.user.id)
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => {
            console.warn('⏱️ Profile fetch in auth change timed out')
            resolve(null)
          }, 6000) // 6 second timeout
        })
        
        Promise.race([profilePromise, timeoutPromise])
          .then((profile) => {
            console.log('Profile fetch in auth change complete:', profile ? '✅ Found' : '❌ Not found')
            if (mounted) {
              setProfile(profile)
              setLoading(false)
            }
          })
          .catch((err) => {
            console.error('Error fetching profile in auth change:', err)
            if (mounted) {
              setProfile(null)
              setLoading(false)
            }
          })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      initialLoadComplete = true
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, []) // Empty deps - only run once on mount

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error ? new Error(error.message) : null }
  }

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: string
  ) => {
    // First, sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return { error: new Error(authError.message) }
    }

    // Then, create user profile in public.users table
    if (authData.user) {
      const { error: profileError } = await supabase.from('users').insert({
        auth_id: authData.user.id,
        email,
        full_name: fullName,
        role: role as UserProfile['role'],
      })

      if (profileError) {
        // Note: If profile creation fails, the auth user will remain
        // Admin can manually delete via Supabase dashboard if needed
        return { error: new Error(profileError.message) }
      }

      // Fetch the newly created profile
      const profile = await fetchUserProfile(authData.user.id)
      setProfile(profile)
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: profile?.role === 'admin',
    isManager: profile?.role === 'manager',
    isCashier: profile?.role === 'cashier',
    isStock: profile?.role === 'stock',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // During hot reload, context might be temporarily undefined
    // Return a default context to prevent crashes
    console.warn('useAuth called outside AuthProvider - returning default context')
    return {
      user: null,
      profile: null,
      session: null,
      loading: true,
      signIn: async () => ({ error: new Error('Not initialized') }),
      signUp: async () => ({ error: new Error('Not initialized') }),
      signOut: async () => {},
      isAdmin: false,
      isManager: false,
      isCashier: false,
      isStock: false,
    } as AuthContextType
  }
  return context
}

