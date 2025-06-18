import {
  getClients,
  getAllClientRecords,
  createClientRecord,
  updateClient,
  deleteClient
} from '../clients'
import { createClient } from '@/lib/supabase/client'
import { Client, CreateClientInput, UpdateClientInput } from '@/types/database'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}))

describe('clients service', () => {
  let mockSupabase: any
  let mockFrom: any
  let mockSelect: any
  let mockInsert: any
  let mockUpdate: any
  let mockDelete: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Create chainable mock methods
    mockSelect = jest.fn().mockReturnThis()
    mockInsert = jest.fn().mockReturnThis()
    mockUpdate = jest.fn().mockReturnThis()
    mockDelete = jest.fn().mockReturnThis()
    
    mockFrom = jest.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    })

    mockSupabase = {
      from: mockFrom
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('getClients', () => {
    const mockClients: Client[] = [
      {
        id: '1',
        name: 'Client A',
        email: 'clienta@example.com',
        hourly_rate: 100,
        currency: 'USD',
        address: '123 Main St',
        is_active: true,
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Client B',
        email: 'clientb@example.com',
        hourly_rate: 85,
        currency: 'USD',
        address: '456 Oak Ave',
        is_active: true,
        user_id: 'user-1',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }
    ]

    it('should fetch clients successfully', async () => {
      const mockResponse = { data: mockClients, error: null }
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })

      const result = await getClients()

      expect(createClient).toHaveBeenCalledTimes(1)
      expect(mockSupabase.from).toHaveBeenCalledWith('clients')
      expect(result).toEqual(mockClients)
    })

    it('should throw error when Supabase returns an error', async () => {
      const mockError = new Error('Database connection failed')
      const mockResponse = { data: null, error: mockError }
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })

      await expect(getClients()).rejects.toThrow('Database connection failed')
    })

    it('should order clients by name', async () => {
      const mockResponse = { data: mockClients, error: null }
      const mockOrder = jest.fn().mockResolvedValue(mockResponse)
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: mockOrder
        })
      })

      await getClients()

      expect(mockOrder).toHaveBeenCalledWith('name')
    })
  })

  describe('getAllClientRecords', () => {
    it('should fetch all client records successfully', async () => {
      const mockClients = [{ id: '1', name: 'Client A' }]
      const mockResponse = { data: mockClients, error: null }
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })

      const result = await getAllClientRecords()

      expect(createClient).toHaveBeenCalledTimes(1)
      expect(mockSupabase.from).toHaveBeenCalledWith('clients')
      expect(result).toEqual(mockClients)
    })

    it('should throw error when database query fails', async () => {
      const mockError = new Error('Query failed')
      const mockResponse = { data: null, error: mockError }
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })

      await expect(getAllClientRecords()).rejects.toThrow('Query failed')
    })
  })

  describe('createClientRecord', () => {
    const mockInput: CreateClientInput = {
      name: 'New Client',
      email: 'new@example.com',
      hourly_rate: 90,
      currency: 'USD',
      address: '789 Pine St'
    }

    const mockCreatedClient: Client = {
      id: '3',
      ...mockInput,
      is_active: true,
      user_id: 'user-1',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    }

    it('should create client successfully', async () => {
      const mockResponse = { data: mockCreatedClient, error: null }
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockResponse)
          })
        })
      })

      const result = await createClientRecord(mockInput, 'user-1')

      expect(createClient).toHaveBeenCalledTimes(1)
      expect(mockSupabase.from).toHaveBeenCalledWith('clients')
      expect(result).toEqual(mockCreatedClient)
    })

    it('should include user_id in the client data', async () => {
      const mockResponse = { data: mockCreatedClient, error: null }
      const mockInsertChain = {
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockResponse)
        })
      }
      const mockInsert = jest.fn().mockReturnValue(mockInsertChain)
      mockFrom.mockReturnValue({ insert: mockInsert })

      await createClientRecord(mockInput, 'user-123')

      expect(mockInsert).toHaveBeenCalledWith({
        ...mockInput,
        user_id: 'user-123'
      })
    })

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Creation failed')
      const mockResponse = { data: null, error: mockError }
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockResponse)
          })
        })
      })

      await expect(createClientRecord(mockInput, 'user-1')).rejects.toThrow('Creation failed')
    })
  })

  describe('updateClient', () => {
    const mockUpdateInput: UpdateClientInput = {
      name: 'Updated Client',
      hourly_rate: 95
    }

    const mockUpdatedClient: Client = {
      id: '1',
      name: 'Updated Client',
      email: 'client@example.com',
      hourly_rate: 95,
      currency: 'USD',
      address: '123 Main St',
      is_active: true,
      user_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    }

    it('should update client successfully', async () => {
      const mockResponse = { data: mockUpdatedClient, error: null }
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockResponse)
            })
          })
        })
      })

      const result = await updateClient('1', mockUpdateInput)

      expect(createClient).toHaveBeenCalledTimes(1)
      expect(mockSupabase.from).toHaveBeenCalledWith('clients')
      expect(result).toEqual(mockUpdatedClient)
    })

    it('should update the correct client by ID', async () => {
      const mockResponse = { data: mockUpdatedClient, error: null }
      const mockEq = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockResponse)
        })
      })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ update: mockUpdate })

      await updateClient('client-123', mockUpdateInput)

      expect(mockUpdate).toHaveBeenCalledWith(mockUpdateInput)
      expect(mockEq).toHaveBeenCalledWith('id', 'client-123')
    })

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed')
      const mockResponse = { data: null, error: mockError }
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockResponse)
            })
          })
        })
      })

      await expect(updateClient('1', mockUpdateInput)).rejects.toThrow('Update failed')
    })
  })

  describe('deleteClient', () => {
    it('should soft delete client successfully', async () => {
      const mockResponse = { error: null }
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue(mockResponse)
        })
      })

      await expect(deleteClient('1')).resolves.not.toThrow()

      expect(createClient).toHaveBeenCalledTimes(1)
      expect(mockSupabase.from).toHaveBeenCalledWith('clients')
    })

    it('should set is_active to false for soft delete', async () => {
      const mockResponse = { error: null }
      const mockEq = jest.fn().mockResolvedValue(mockResponse)
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ update: mockUpdate })

      await deleteClient('client-123')

      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false })
      expect(mockEq).toHaveBeenCalledWith('id', 'client-123')
    })

    it('should throw error when deletion fails', async () => {
      const mockError = new Error('Deletion failed')
      const mockResponse = { error: mockError }
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue(mockResponse)
        })
      })

      await expect(deleteClient('1')).rejects.toThrow('Deletion failed')
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle empty result sets', async () => {
      const mockResponse = { data: [], error: null }
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })

      const result = await getClients()

      expect(result).toEqual([])
    })

    it('should handle null data response', async () => {
      const mockResponse = { data: null, error: null }
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })

      const result = await getClients()

      expect(result).toBeNull()
    })

    it('should propagate network errors', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockRejectedValue(new Error('Network error'))
        })
      })

      await expect(getClients()).rejects.toThrow('Network error')
    })
  })
})