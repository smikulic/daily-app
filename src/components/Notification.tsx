'use client'

import { useEffect } from 'react'

interface NotificationProps {
  type: 'success' | 'error'
  message: string
  onClose: () => void
}

export function Notification({ type, message, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === 'success' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800'

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-md border ${bgColor} ${textColor} shadow-lg`}>
      <div className="flex items-center">
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-sm font-medium hover:opacity-75"
        >
          ✕
        </button>
      </div>
    </div>
  )
}