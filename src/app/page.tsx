import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  async function signOut() {
    'use server'
    
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Daily Time Tracker</h1>
          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign out
            </button>
          </form>
        </header>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Welcome!</h2>
          <p className="text-gray-600">Signed in as: <span className="font-medium">{user.email}</span></p>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Your time tracking dashboard will appear here. You&apos;ll be able to:
            </p>
            <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
              <li>Track your daily work hours</li>
              <li>Manage clients and projects</li>
              <li>View reports and analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}