'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestConnection() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function checkConnection() {
      try {
        const supabase = createClient()
        
        // Test the connection by checking if we can access auth
        const { error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }
        
        setStatus('connected')
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    checkConnection()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">Supabase Connection Test</h1>
        
        <div className="p-6 rounded-lg border">
          {status === 'checking' && (
            <p className="text-center">Checking connection...</p>
          )}
          
          {status === 'connected' && (
            <div className="text-center">
              <p className="text-green-600 font-semibold">✓ Connected to Supabase</p>
              <p className="text-sm text-gray-600 mt-2">
                Your Supabase client is properly configured.
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center">
              <p className="text-red-600 font-semibold">✗ Connection Error</p>
              <p className="text-sm text-gray-600 mt-2">{error}</p>
              <p className="text-sm text-gray-500 mt-4">
                Please check your .env.local file and ensure you have set:
              </p>
              <pre className="text-xs bg-gray-100 p-2 mt-2 rounded">
                NEXT_PUBLIC_SUPABASE_URL
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}