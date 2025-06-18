'use client'

import { usePathname } from 'next/navigation'
import { Navigation } from './Navigation'

interface AppLayoutProps {
  children: React.ReactNode
}

// Routes that should show the navigation
const protectedRoutes = ['/', '/clients', '/reports']

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const showNavigation = protectedRoutes.includes(pathname)

  if (!showNavigation) {
    return <>{children}</>
  }

  return (
    <div className="flex">
      <Navigation />
      <div className="flex flex-col items-center w-full bg-stone-50 min-h-screen">
        {children}
      </div>
    </div>
  )
}