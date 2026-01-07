import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'
import type { User } from '@supabase/supabase-js'

describe('authStore', () => {
  beforeEach(() => {
    const { setUser, setSession, setError, setLoading } = useAuthStore.getState()
    setUser(null)
    setSession(null)
    setError(null)
    setLoading(false)
  })

  it('should initialize with null user and session', () => {
    const { user, session, loading, error } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(session).toBeNull()
    expect(loading).toBe(false)
    expect(error).toBeNull()
  })

  it('should set user correctly', () => {
    const mockUser: Partial<User> = {
      id: '123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    }
    
    useAuthStore.getState().setUser(mockUser as User)
    
    const { user } = useAuthStore.getState()
    expect(user).toEqual(mockUser)
  })

  it('should set error correctly', () => {
    const errorMessage = 'Authentication failed'
    
    useAuthStore.getState().setError(errorMessage)
    
    const { error } = useAuthStore.getState()
    expect(error).toBe(errorMessage)
  })

  it('should set loading state correctly', () => {
    useAuthStore.getState().setLoading(true)
    
    const { loading } = useAuthStore.getState()
    expect(loading).toBe(true)
  })
})
