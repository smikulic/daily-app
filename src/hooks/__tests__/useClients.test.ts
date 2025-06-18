import { renderHook, act } from '@testing-library/react'
import { useClients } from '../useClients'
import * as clientsService from '@/services/clients'
import { Client, CreateClientInput, UpdateClientInput } from '@/types/database'

// Mock the clients service
jest.mock('@/services/clients', () => ({
  getAllClientRecords: jest.fn(),
  createClientRecord: jest.fn(),
  updateClient: jest.fn(),
  deleteClient: jest.fn()
}))

describe('useClients', () => {
  const mockClients: Client[] = [
    {
      id: '1',
      name: 'TechCorp',
      email: 'tech@corp.com',
      hourly_rate: 85,
      currency: 'USD',
      address: '123 Tech St',
      is_active: true,
      user_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'StartupXYZ',
      email: 'hello@startup.com',
      hourly_rate: 90,
      currency: 'USD',
      address: '456 Innovation Ave',
      is_active: true,
      user_id: 'user-1',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useClients())

      expect(result.current.clients).toEqual([])
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe(null)
      expect(typeof result.current.loadClients).toBe('function')
      expect(typeof result.current.createClient).toBe('function')
      expect(typeof result.current.updateClient).toBe('function')
      expect(typeof result.current.deleteClient).toBe('function')
    })
  })

  describe('loadClients', () => {
    it('should load clients successfully', async () => {
      ;(clientsService.getAllClientRecords as jest.Mock).mockResolvedValue(mockClients)

      const { result } = renderHook(() => useClients())

      await act(async () => {
        await result.current.loadClients()
      })

      expect(clientsService.getAllClientRecords).toHaveBeenCalledTimes(1)
      expect(result.current.clients).toEqual(mockClients)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle loading state correctly', async () => {
      let resolvePromise: (value: Client[]) => void
      const promise = new Promise<Client[]>((resolve) => {
        resolvePromise = resolve
      })

      ;(clientsService.getAllClientRecords as jest.Mock).mockReturnValue(promise)

      const { result } = renderHook(() => useClients())

      act(() => {
        result.current.loadClients()
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe(null)

      await act(async () => {
        resolvePromise(mockClients)
        await promise
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.clients).toEqual(mockClients)
    })

    it('should handle errors when loading clients fails', async () => {
      const error = new Error('Failed to fetch clients')
      ;(clientsService.getAllClientRecords as jest.Mock).mockRejectedValue(error)

      const { result } = renderHook(() => useClients())

      await act(async () => {
        await result.current.loadClients()
      })

      expect(result.current.clients).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Failed to load clients')
      expect(console.error).toHaveBeenCalledWith('Error loading clients:', error)
    })

    it('should reset error state on successful load', async () => {
      // First call fails
      ;(clientsService.getAllClientRecords as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useClients())

      await act(async () => {
        await result.current.loadClients()
      })

      expect(result.current.error).toBe('Failed to load clients')

      // Second call succeeds
      ;(clientsService.getAllClientRecords as jest.Mock).mockResolvedValueOnce(mockClients)

      await act(async () => {
        await result.current.loadClients()
      })

      expect(result.current.error).toBe(null)
      expect(result.current.clients).toEqual(mockClients)
    })
  })

  describe('createClient', () => {
    const mockInput: CreateClientInput = {
      name: 'New Client',
      email: 'new@client.com',
      hourly_rate: 95,
      currency: 'USD',
      address: '789 New St'
    }

    it('should create client successfully and refresh list', async () => {
      ;(clientsService.createClientRecord as jest.Mock).mockResolvedValue(mockClients[0])
      ;(clientsService.getAllClientRecords as jest.Mock).mockResolvedValue([...mockClients, mockClients[0]])

      const { result } = renderHook(() => useClients())

      let createResult: { success: boolean; error: string | null } | undefined

      await act(async () => {
        createResult = await result.current.createClient(mockInput, 'user-1')
      })

      expect(clientsService.createClientRecord).toHaveBeenCalledWith(mockInput, 'user-1')
      expect(clientsService.getAllClientRecords).toHaveBeenCalledTimes(1)
      expect(createResult).toEqual({ success: true, error: null })
    })

    it('should handle creation errors', async () => {
      const error = new Error('Creation failed')
      ;(clientsService.createClientRecord as jest.Mock).mockRejectedValue(error)

      const { result } = renderHook(() => useClients())

      let createResult: { success: boolean; error: string | null } | undefined

      await act(async () => {
        createResult = await result.current.createClient(mockInput, 'user-1')
      })

      expect(createResult).toEqual({ success: false, error: 'Failed to create client' })
      expect(console.error).toHaveBeenCalledWith('Error creating client:', error)
      expect(clientsService.getAllClientRecords).not.toHaveBeenCalled()
    })

    it('should not refresh list if creation fails', async () => {
      ;(clientsService.createClientRecord as jest.Mock).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useClients())

      await act(async () => {
        await result.current.createClient(mockInput, 'user-1')
      })

      expect(clientsService.getAllClientRecords).not.toHaveBeenCalled()
    })
  })

  describe('updateClient', () => {
    const mockUpdateInput: UpdateClientInput = {
      name: 'Updated Client',
      hourly_rate: 100
    }

    it('should update client successfully and refresh list', async () => {
      ;(clientsService.updateClient as jest.Mock).mockResolvedValue(mockClients[0])
      ;(clientsService.getAllClientRecords as jest.Mock).mockResolvedValue(mockClients)

      const { result } = renderHook(() => useClients())

      let updateResult: { success: boolean; error: string | null } | undefined

      await act(async () => {
        updateResult = await result.current.updateClient('1', mockUpdateInput)
      })

      expect(clientsService.updateClient).toHaveBeenCalledWith('1', mockUpdateInput)
      expect(clientsService.getAllClientRecords).toHaveBeenCalledTimes(1)
      expect(updateResult).toEqual({ success: true, error: null })
    })

    it('should handle update errors', async () => {
      const error = new Error('Update failed')
      ;(clientsService.updateClient as jest.Mock).mockRejectedValue(error)

      const { result } = renderHook(() => useClients())

      let updateResult: { success: boolean; error: string | null } | undefined

      await act(async () => {
        updateResult = await result.current.updateClient('1', mockUpdateInput)
      })

      expect(updateResult).toEqual({ success: false, error: 'Failed to update client' })
      expect(console.error).toHaveBeenCalledWith('Error updating client:', error)
      expect(clientsService.getAllClientRecords).not.toHaveBeenCalled()
    })
  })

  describe('deleteClient', () => {
    it('should delete client successfully and refresh list', async () => {
      ;(clientsService.deleteClient as jest.Mock).mockResolvedValue(undefined)
      ;(clientsService.getAllClientRecords as jest.Mock).mockResolvedValue([mockClients[1]])

      const { result } = renderHook(() => useClients())

      let deleteResult: { success: boolean; error: string | null } | undefined

      await act(async () => {
        deleteResult = await result.current.deleteClient('1')
      })

      expect(clientsService.deleteClient).toHaveBeenCalledWith('1')
      expect(clientsService.getAllClientRecords).toHaveBeenCalledTimes(1)
      expect(deleteResult).toEqual({ success: true, error: null })
    })

    it('should handle deletion errors', async () => {
      const error = new Error('Deletion failed')
      ;(clientsService.deleteClient as jest.Mock).mockRejectedValue(error)

      const { result } = renderHook(() => useClients())

      let deleteResult: { success: boolean; error: string | null } | undefined

      await act(async () => {
        deleteResult = await result.current.deleteClient('1')
      })

      expect(deleteResult).toEqual({ success: false, error: 'Failed to delete client' })
      expect(console.error).toHaveBeenCalledWith('Error deleting client:', error)
      expect(clientsService.getAllClientRecords).not.toHaveBeenCalled()
    })
  })

  describe('callback dependencies', () => {
    it('should maintain stable function references with same dependencies', () => {
      const { result, rerender } = renderHook(() => useClients())

      const initialCallbacks = {
        loadClients: result.current.loadClients,
        createClient: result.current.createClient,
        updateClient: result.current.updateClient,
        deleteClient: result.current.deleteClient
      }

      rerender()

      expect(result.current.loadClients).toBe(initialCallbacks.loadClients)
      expect(result.current.createClient).toBe(initialCallbacks.createClient)
      expect(result.current.updateClient).toBe(initialCallbacks.updateClient)
      expect(result.current.deleteClient).toBe(initialCallbacks.deleteClient)
    })
  })

  describe('error scenarios', () => {
    it('should handle network errors gracefully', async () => {
      ;(clientsService.getAllClientRecords as jest.Mock).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useClients())

      await act(async () => {
        await result.current.loadClients()
      })

      expect(result.current.error).toBe('Failed to load clients')
      expect(result.current.loading).toBe(false)
      expect(result.current.clients).toEqual([])
    })

    it('should handle service unavailable errors', async () => {
      ;(clientsService.createClientRecord as jest.Mock).mockRejectedValue(new Error('Service unavailable'))

      const { result } = renderHook(() => useClients())

      const createResult = await act(async () => {
        return await result.current.createClient({
          name: 'Test',
          email: 'test@test.com',
          hourly_rate: 50,
          currency: 'USD',
          address: 'Test Address'
        }, 'user-1')
      })

      expect(createResult.success).toBe(false)
      expect(createResult.error).toBe('Failed to create client')
    })
  })

  describe('concurrent operations', () => {
    it('should handle multiple concurrent load operations', async () => {
      ;(clientsService.getAllClientRecords as jest.Mock).mockResolvedValue(mockClients)

      const { result } = renderHook(() => useClients())

      await act(async () => {
        await Promise.all([
          result.current.loadClients(),
          result.current.loadClients(),
          result.current.loadClients()
        ])
      })

      expect(clientsService.getAllClientRecords).toHaveBeenCalledTimes(3)
      expect(result.current.clients).toEqual(mockClients)
      expect(result.current.loading).toBe(false)
    })
  })
})