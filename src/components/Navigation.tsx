'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function Navigation() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <div className="relative flex flex-col h-screen w-60 bg-stone-100">
      {/* User Info Header */}
      <div className="h-16 flex items-center px-6 py-4 font-medium text-stone-900 bg-stone-100">
        <div className="truncate w-32">{user.email}</div>
      </div>

      <hr className="border-stone-200" />

      {/* Navigation Links */}
      <nav className="flex-1">
        <Link 
          href="/" 
          className={`flex items-center px-6 py-4 font-medium text-stone-900 bg-stone-100 hover:bg-stone-200 hover:text-blue-600 cursor-pointer transition-colors ${
            isActive('/') ? 'bg-stone-200 text-blue-600' : ''
          }`}
        >
          <svg
            className="w-5 h-5 mr-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Tracker
        </Link>

        <Link 
          href="/clients" 
          className={`flex items-center px-6 py-4 font-medium text-stone-900 bg-stone-100 hover:bg-stone-200 hover:text-blue-600 cursor-pointer transition-colors ${
            isActive('/clients') ? 'bg-stone-200 text-blue-600' : ''
          }`}
        >
          <svg
            className="w-5 h-5 mr-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
          Clients
        </Link>

        <Link 
          href="/reports" 
          className={`flex items-center px-6 py-4 font-medium text-stone-900 bg-stone-100 hover:bg-stone-200 hover:text-blue-600 cursor-pointer transition-colors ${
            isActive('/reports') ? 'bg-stone-200 text-blue-600' : ''
          }`}
        >
          <svg
            className="w-5 h-5 mr-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
          Reports
        </Link>
      </nav>

      {/* Sign Out Button */}
      <button
        onClick={signOut}
        className="absolute bottom-0 w-full flex items-center px-6 py-4 font-medium text-stone-900 bg-stone-100 hover:bg-stone-200 hover:text-red-600 cursor-pointer transition-colors"
      >
        <svg
          className="w-5 h-5 mr-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
          />
        </svg>
        Sign out
      </button>
    </div>
  )
}