import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '../middleware'
import { createServerClient } from '@supabase/ssr'

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(),
    redirect: jest.fn(),
  },
}))

// Mock Supabase SSR
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

describe('middleware', () => {
  let mockRequest: jest.Mocked<NextRequest>
  let mockResponse: any
  let mockSupabase: any
  let mockCreateServerClient: jest.MockedFunction<typeof createServerClient>

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    // Mock NextResponse
    mockResponse = {
      cookies: {
        set: jest.fn(),
      },
    }
    ;(NextResponse.next as jest.Mock).mockReturnValue(mockResponse)
    ;(NextResponse.redirect as jest.Mock).mockImplementation((url) => ({
      redirect: true,
      url: url.toString(),
    }))

    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
    }
    mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
    mockCreateServerClient.mockReturnValue(mockSupabase)

    // Mock NextRequest
    mockRequest = {
      headers: new Headers(),
      cookies: {
        get: jest.fn(),
        set: jest.fn(),
      },
      nextUrl: {
        pathname: '/',
      },
      url: 'https://example.com/',
    } as any
  })

  describe('Supabase client configuration', () => {
    it('should create Supabase client with correct environment variables', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      await middleware(mockRequest)

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          cookies: expect.any(Object),
        })
      )
    })

    it('should configure cookie handlers correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      mockRequest.cookies.get = jest.fn().mockReturnValue({ value: 'test-cookie-value' })

      await middleware(mockRequest)

      const cookieConfig = mockCreateServerClient.mock.calls[0][2]
      
      // Test get cookie
      const getValue = cookieConfig.cookies.get('test-cookie')
      expect(mockRequest.cookies.get).toHaveBeenCalledWith('test-cookie')

      // Test set cookie
      cookieConfig.cookies.set('new-cookie', 'new-value', { path: '/' })
      expect(mockRequest.cookies.set).toHaveBeenCalledWith({
        name: 'new-cookie',
        value: 'new-value',
        path: '/',
      })
      expect(mockResponse.cookies.set).toHaveBeenCalledWith({
        name: 'new-cookie',
        value: 'new-value',
        path: '/',
      })

      // Test remove cookie
      cookieConfig.cookies.remove('old-cookie', { path: '/' })
      expect(mockRequest.cookies.set).toHaveBeenCalledWith({
        name: 'old-cookie',
        value: '',
        path: '/',
      })
      expect(mockResponse.cookies.set).toHaveBeenCalledWith({
        name: 'old-cookie',
        value: '',
        path: '/',
      })
    })
  })

  describe('Authentication routing', () => {
    describe('when user is not authenticated', () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      })

      it('should redirect to /login when accessing protected root route', async () => {
        mockRequest.nextUrl.pathname = '/'
        mockRequest.url = 'https://example.com/'

        const result = await middleware(mockRequest)

        expect(NextResponse.redirect).toHaveBeenCalledWith(new URL('/login', 'https://example.com/'))
        expect(result).toEqual({
          redirect: true,
          url: 'https://example.com/login',
        })
      })

      it('should allow access to /login page', async () => {
        mockRequest.nextUrl.pathname = '/login'
        mockRequest.url = 'https://example.com/login'

        const result = await middleware(mockRequest)

        expect(NextResponse.redirect).not.toHaveBeenCalled()
        expect(result).toBe(mockResponse)
      })

      it('should allow access to /register page', async () => {
        mockRequest.nextUrl.pathname = '/register'
        mockRequest.url = 'https://example.com/register'

        const result = await middleware(mockRequest)

        expect(NextResponse.redirect).not.toHaveBeenCalled()
        expect(result).toBe(mockResponse)
      })
    })

    describe('when user is authenticated', () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              aud: 'authenticated',
              role: 'authenticated',
            },
          },
          error: null,
        })
      })

      it('should allow access to protected root route', async () => {
        mockRequest.nextUrl.pathname = '/'
        mockRequest.url = 'https://example.com/'

        const result = await middleware(mockRequest)

        expect(NextResponse.redirect).not.toHaveBeenCalled()
        expect(result).toBe(mockResponse)
      })

      it('should redirect to / when accessing /login', async () => {
        mockRequest.nextUrl.pathname = '/login'
        mockRequest.url = 'https://example.com/login'

        const result = await middleware(mockRequest)

        expect(NextResponse.redirect).toHaveBeenCalledWith(new URL('/', 'https://example.com/login'))
        expect(result).toEqual({
          redirect: true,
          url: 'https://example.com/',
        })
      })

      it('should redirect to / when accessing /register', async () => {
        mockRequest.nextUrl.pathname = '/register'
        mockRequest.url = 'https://example.com/register'

        const result = await middleware(mockRequest)

        expect(NextResponse.redirect).toHaveBeenCalledWith(new URL('/', 'https://example.com/register'))
        expect(result).toEqual({
          redirect: true,
          url: 'https://example.com/',
        })
      })
    })
  })

  describe('NextResponse handling', () => {
    it('should create NextResponse with correct headers', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      mockRequest.nextUrl.pathname = '/login'

      await middleware(mockRequest)

      expect(NextResponse.next).toHaveBeenCalledWith({
        request: {
          headers: mockRequest.headers,
        },
      })
    })

    it('should return the NextResponse when no redirect is needed', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      mockRequest.nextUrl.pathname = '/login'

      const result = await middleware(mockRequest)

      expect(result).toBe(mockResponse)
    })
  })

  describe('error handling', () => {
    it('should handle Supabase auth errors gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error', status: 500 },
      })
      mockRequest.nextUrl.pathname = '/'

      const result = await middleware(mockRequest)

      // Should treat as unauthenticated user and redirect
      expect(NextResponse.redirect).toHaveBeenCalledWith(new URL('/login', mockRequest.url))
    })

    it('should handle network errors gracefully', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'))
      mockRequest.nextUrl.pathname = '/'

      await expect(middleware(mockRequest)).rejects.toThrow('Network error')
    })
  })

  describe('cookie management', () => {
    it('should handle missing cookies gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      mockRequest.cookies.get = jest.fn().mockReturnValue(undefined)

      await middleware(mockRequest)

      const cookieConfig = mockCreateServerClient.mock.calls[0][2]
      const result = cookieConfig.cookies.get('nonexistent-cookie')
      
      expect(result).toBeUndefined()
    })

    it('should properly extract cookie values', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      mockRequest.cookies.get = jest.fn().mockReturnValue({ value: 'test-value' })

      await middleware(mockRequest)

      const cookieConfig = mockCreateServerClient.mock.calls[0][2]
      const result = cookieConfig.cookies.get('test-cookie')
      
      expect(result).toBe('test-value')
    })
  })

  describe('URL handling', () => {
    it('should construct redirect URLs correctly with different domains', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      mockRequest.nextUrl.pathname = '/'
      mockRequest.url = 'https://mydomain.com/dashboard'

      await middleware(mockRequest)

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/login', 'https://mydomain.com/dashboard')
      )
    })

    it('should handle complex URLs with query parameters', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
        },
      })
      mockRequest.nextUrl.pathname = '/login'
      mockRequest.url = 'https://example.com/login?redirect=/dashboard'

      await middleware(mockRequest)

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/', 'https://example.com/login?redirect=/dashboard')
      )
    })
  })

  describe('middleware configuration', () => {
    it('should export correct matcher configuration', () => {
      // Import the config directly
      const { config } = require('../middleware')
      
      expect(config).toEqual({
        matcher: ['/', '/login', '/register']
      })
    })
  })
})

// Integration-style tests
describe('middleware integration scenarios', () => {
  let mockRequest: jest.Mocked<NextRequest>
  let mockResponse: any
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    mockResponse = {
      cookies: { set: jest.fn() },
    }
    ;(NextResponse.next as jest.Mock).mockReturnValue(mockResponse)
    ;(NextResponse.redirect as jest.Mock).mockImplementation((url) => ({
      redirect: true,
      url: url.toString(),
    }))

    mockSupabase = {
      auth: { getUser: jest.fn() },
    }
    ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

    mockRequest = {
      headers: new Headers(),
      cookies: { get: jest.fn(), set: jest.fn() },
      nextUrl: { pathname: '/' },
      url: 'https://example.com/',
    } as any
  })

  it('should handle complete auth flow: unauthenticated → login → authenticated → redirect', async () => {
    // Step 1: Unauthenticated user tries to access protected route
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    mockRequest.nextUrl.pathname = '/'
    
    let result = await middleware(mockRequest)
    expect(result).toMatchObject({ redirect: true, url: 'https://example.com/login' })

    // Step 2: User accesses login page
    mockRequest.nextUrl.pathname = '/login'
    mockRequest.url = 'https://example.com/login'
    
    result = await middleware(mockRequest)
    expect(result).toBe(mockResponse) // No redirect, allow access

    // Step 3: After login, authenticated user tries to access login again
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    })
    
    result = await middleware(mockRequest)
    expect(result).toMatchObject({ redirect: true, url: 'https://example.com/' })
  })

  it('should handle registration flow correctly', async () => {
    // Unauthenticated user accesses register page
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    mockRequest.nextUrl.pathname = '/register'
    mockRequest.url = 'https://example.com/register'
    
    const result = await middleware(mockRequest)
    expect(result).toBe(mockResponse) // Allow access to register

    // After registration, authenticated user gets redirected
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'new@example.com' } },
      error: null,
    })
    
    const resultAfterAuth = await middleware(mockRequest)
    expect(resultAfterAuth).toMatchObject({ redirect: true, url: 'https://example.com/' })
  })
})