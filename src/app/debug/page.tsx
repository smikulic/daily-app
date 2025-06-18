'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugPage() {
  const [status, setStatus] = useState<string>('Checking...')
  const [envVars, setEnvVars] = useState<{
    url: string
    key: string
    urlValue: string
    keyValue: string
  }>({ url: '', key: '', urlValue: '', keyValue: '' })

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    setEnvVars({
      url: url ? 'Set' : 'Not set',
      key: key ? 'Set' : 'Not set',
      urlValue: url || 'undefined',
      keyValue: key ? `${key.substring(0, 10)}...` : 'undefined'
    })

    try {
      const supabase = createClient()
      if (supabase) {
        setStatus('Client created successfully')
        
        // Test a simple auth call
        supabase.auth.getSession().then(({ error }) => {
          if (error) {
            setStatus(`Auth error: ${error.message}`)
          } else {
            setStatus('Auth working - client is functional')
          }
        })
      } else {
        setStatus('Client creation returned undefined')
      }
    } catch (error) {
      setStatus(`Error creating client: ${error}`)
    }
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Debug</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Environment Variables:</h2>
          <ul className="list-disc ml-6">
            <li>NEXT_PUBLIC_SUPABASE_URL: {envVars.url} ({envVars.urlValue})</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {envVars.key} ({envVars.keyValue})</li>
          </ul>
        </div>
        
        <div>
          <h2 className="font-semibold">Client Status:</h2>
          <p>{status}</p>
        </div>
      </div>
    </div>
  )
}