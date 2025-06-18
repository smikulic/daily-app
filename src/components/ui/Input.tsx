import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'block w-full rounded-md border shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-violet-500 focus:ring-violet-500',
          'px-3 py-2 text-sm',
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }