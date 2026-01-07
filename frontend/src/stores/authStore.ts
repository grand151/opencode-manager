import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/services/supabaseClient'
import type { User, AuthError, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  initialized: boolean
  authListener: { unsubscribe: () => void } | null
  
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: false,
      error: null,
      initialized: false,
      authListener: null,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      signIn: async (email: string, password: string) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) throw error

          set({
            user: data.user,
            session: data.session,
            loading: false,
          })
        } catch (error) {
          const authError = error as AuthError
          set({
            error: authError.message,
            loading: false,
          })
          throw error
        }
      },

      signUp: async (email: string, password: string) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          })

          if (error) throw error

          set({
            user: data.user,
            session: data.session,
            loading: false,
          })
        } catch (error) {
          const authError = error as AuthError
          set({
            error: authError.message,
            loading: false,
          })
          throw error
        }
      },

      signOut: async () => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase.auth.signOut()
          if (error) throw error

          set({
            user: null,
            session: null,
            loading: false,
          })
        } catch (error) {
          const authError = error as AuthError
          set({
            error: authError.message,
            loading: false,
          })
          throw error
        }
      },

      initialize: async () => {
        const state = get()
        if (state.initialized) return

        if (state.authListener) {
          state.authListener.unsubscribe()
        }

        set({ loading: true })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            set({
              user: session.user,
              session,
              initialized: true,
              loading: false,
            })
          } else {
            set({
              initialized: true,
              loading: false,
            })
          }

          const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            set({
              user: session?.user ?? null,
              session,
            })
          })

          set({ authListener: listener.subscription })
        } catch (error) {
          const authError = error as AuthError
          set({
            error: authError.message,
            initialized: true,
            loading: false,
          })
        }
      },
    }),
    {
      name: 'opencode-auth',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
)
