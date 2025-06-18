'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User
  loading: boolean
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Protected routes that require authentication
const protectedRoutes = ['/', '/clients', '/reports']

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/debug', '/test-connection']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Handle redirects based on auth state
        if (session?.user) {
          // User is logged in
          if (publicRoutes.includes(pathname)) {
            router.push('/')
          }
        } else {
          // User is logged out
          if (protectedRoutes.includes(pathname)) {
            router.push('/login')
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, router, pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  async function getInitialSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Handle initial redirect
      if (!user && protectedRoutes.includes(pathname)) {
        router.push('/login')
      } else if (user && publicRoutes.includes(pathname)) {
        router.push('/')
      }
    } catch (error) {
      console.error('Error getting user:', error)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  async function refresh() {
    await getInitialSession()
  }

  // Don't render protected content if user is not authenticated
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  // For protected routes, ensure user exists
  if (protectedRoutes.includes(pathname) && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Redirecting...</p>
      </div>
    )
  }

  // For public routes or when user exists, provide the context
  const value = user ? {
    user,
    loading,
    signOut,
    refresh
  } : undefined

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider and user must be authenticated')
  }
  return context
}