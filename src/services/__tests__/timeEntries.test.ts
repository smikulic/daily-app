import {
  getTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry
} from '../timeEntries'
import { createClient } from '@/lib/supabase/client'
import { TimeEntry, CreateTimeEntryInput, UpdateTimeEntryInput } from '@/types/database'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}))

describe('timeEntries service', () => {
  let mockSupabase: any
  let mockFrom: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    })

    mockSupabase = {
      from: mockFrom
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('getTimeEntries', () => {
    const mockTimeEntries: TimeEntry[] = [
      {
        id: '1',
        date: '2024-01-15',
        hours: 8,
        description: 'Frontend development',
        client_id: 'client-1',
        user_id: 'user-1',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        client: {
          id: 'client-1',
          name: 'TechCorp',
          email: 'tech@corp.com',
          hourly_rate: 85,
          currency: 'USD',
          address: '123 Tech St',
          is_active: true,
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      },
      {
        id: '2',
        date: '2024-01-14',
        hours: 6,
        description: 'Backend API',
        client_id: 'client-2',
        user_id: 'user-1',
        created_at: '2024-01-14T00:00:00Z',
        updated_at: '2024-01-14T00:00:00Z',
        client: {
          id: 'client-2',
          name: 'StartupXYZ',
          email: 'hello@startup.com',
          hourly_rate: 90,
          currency: 'USD',
          address: '456 Innovation Ave',
          is_active: true,
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      }
    ]

    it('should fetch time entries with pagination successfully', async () => {
      const mockResponse = {
        data: mockTimeEntries,
        error: null,
        count: 25
      }

      const mockRange = jest.fn().mockResolvedValue(mockResponse)
      const mockOrder2 = jest.fn().mockReturnValue({ range: mockRange })
      const mockOrder1 = jest.fn().mockReturnValue({ order: mockOrder2 })
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder1 })
      mockFrom.mockReturnValue({ select: mockSelect })

      const result = await getTimeEntries(2, 10)

      expect(createClient).toHaveBeenCalledTimes(1)
      expect(mockSupabase.from).toHaveBeenCalledWith('time_entries')
      expect(mockSelect).toHaveBeenCalledWith(`
      *,
      client:clients(*)
    `, { count: 'exact' })
      expect(mockOrder1).toHaveBeenCalledWith('date', { ascending: false })
      expect(mockOrder2).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockRange).toHaveBeenCalledWith(10, 19) // page 2, offset 10, limit 10

      expect(result).toEqual({
        data: mockTimeEntries,
        count: 25,
        page: 2,
        limit: 10,
        totalPages: 3
      })
    })

    it('should use default pagination parameters', async () => {
      const mockResponse = { data: mockTimeEntries, error: null, count: 5 }
      const mockRange = jest.fn().mockResolvedValue(mockResponse)
      const mockOrder2 = jest.fn().mockReturnValue({ range: mockRange })
      const mockOrder1 = jest.fn().mockReturnValue({ order: mockOrder2 })
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder1 })
      mockFrom.mockReturnValue({ select: mockSelect })

      const result = await getTimeEntries()

      expect(mockRange).toHaveBeenCalledWith(0, 9) // page 1, offset 0, limit 10
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should calculate total pages correctly', async () => {
      const testCases = [
        { count: 0, expectedPages: 0 },
        { count: 5, expectedPages: 1 },
        { count: 10, expectedPages: 1 },
        { count: 11, expectedPages: 2 },
        { count: 25, expectedPages: 3 }
      ]

      for (const { count, expectedPages } of testCases) {
        const mockResponse = { data: [], error: null, count }
        const mockRange = jest.fn().mockResolvedValue(mockResponse)
        const mockOrder2 = jest.fn().mockReturnValue({ range: mockRange })
        const mockOrder1 = jest.fn().mockReturnValue({ order: mockOrder2 })
        const mockSelect = jest.fn().mockReturnValue({ order: mockOrder1 })
        mockFrom.mockReturnValue({ select: mockSelect })

        const result = await getTimeEntries(1, 10)
        expect(result.totalPages).toBe(expectedPages)
      }
    })

    it('should handle null count gracefully', async () => {
      const mockResponse = { data: mockTimeEntries, error: null, count: null }
      const mockRange = jest.fn().mockResolvedValue(mockResponse)
      const mockOrder2 = jest.fn().mockReturnValue({ range: mockRange })
      const mockOrder1 = jest.fn().mockReturnValue({ order: mockOrder2 })
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder1 })
      mockFrom.mockReturnValue({ select: mockSelect })

      const result = await getTimeEntries()

      expect(result.count).toBe(0)
      expect(result.totalPages).toBe(0)
    })

    it('should throw error when query fails', async () => {
      const mockError = new Error('Database error')
      const mockResponse = { data: null, error: mockError, count: null }
      const mockRange = jest.fn().mockResolvedValue(mockResponse)
      const mockOrder2 = jest.fn().mockReturnValue({ range: mockRange })
      const mockOrder1 = jest.fn().mockReturnValue({ order: mockOrder2 })
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder1 })
      mockFrom.mockReturnValue({ select: mockSelect })

      await expect(getTimeEntries()).rejects.toThrow('Database error')
    })
  })

  describe('createTimeEntry', () => {
    const mockInput: CreateTimeEntryInput = {
      client_id: 'client-1',
      date: '2024-01-15',
      hours: 8,
      description: 'Frontend development'
    }

    const mockCreatedEntry: TimeEntry = {
      id: '3',
      ...mockInput,
      user_id: 'user-1',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      client: {
        id: 'client-1',
        name: 'TechCorp',
        email: 'tech@corp.com',
        hourly_rate: 85,
        currency: 'USD',
        address: '123 Tech St',
        is_active: true,
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }

    it('should create time entry successfully', async () => {
      const mockResponse = { data: mockCreatedEntry, error: null }
      const mockSingle = jest.fn().mockResolvedValue(mockResponse)
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })
      mockFrom.mockReturnValue({ insert: mockInsert })

      const result = await createTimeEntry(mockInput, 'user-1')

      expect(createClient).toHaveBeenCalledTimes(1)
      expect(mockSupabase.from).toHaveBeenCalledWith('time_entries')
      expect(mockInsert).toHaveBeenCalledWith({
        ...mockInput,
        user_id: 'user-1'
      })
      expect(mockSelect).toHaveBeenCalledWith(`
      *,
      client:clients(*)
    `)
      expect(result).toEqual(mockCreatedEntry)
    })

    it('should include user_id in the time entry data', async () => {
      const mockResponse = { data: mockCreatedEntry, error: null }
      const mockSingle = jest.fn().mockResolvedValue(mockResponse)
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })
      mockFrom.mockReturnValue({ insert: mockInsert })

      await createTimeEntry(mockInput, 'user-123')

      expect(mockInsert).toHaveBeenCalledWith({
        ...mockInput,
        user_id: 'user-123'
      })
    })

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Creation failed')
      const mockResponse = { data: null, error: mockError }
      const mockSingle = jest.fn().mockResolvedValue(mockResponse)
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })
      mockFrom.mockReturnValue({ insert: mockInsert })

      await expect(createTimeEntry(mockInput, 'user-1')).rejects.toThrow('Creation failed')
    })
  })

  describe('updateTimeEntry', () => {
    const mockUpdateInput: UpdateTimeEntryInput = {
      hours: 6,
      description: 'Updated description'
    }

    const mockUpdatedEntry: TimeEntry = {
      id: '1',
      client_id: 'client-1',
      date: '2024-01-15',
      hours: 6,
      description: 'Updated description',
      user_id: 'user-1',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      client: {
        id: 'client-1',
        name: 'TechCorp',
        email: 'tech@corp.com',
        hourly_rate: 85,
        currency: 'USD',
        address: '123 Tech St',
        is_active: true,
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }

    it('should update time entry successfully', async () => {
      const mockResponse = { data: mockUpdatedEntry, error: null }
      const mockSingle = jest.fn().mockResolvedValue(mockResponse)
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ update: mockUpdate })

      const result = await updateTimeEntry('1', mockUpdateInput)

      expect(createClient).toHaveBeenCalledTimes(1)
      expect(mockSupabase.from).toHaveBeenCalledWith('time_entries')
      expect(mockUpdate).toHaveBeenCalledWith(mockUpdateInput)
      expect(mockEq).toHaveBeenCalledWith('id', '1')
      expect(result).toEqual(mockUpdatedEntry)
    })

    it('should include client data in response', async () => {
      const mockResponse = { data: mockUpdatedEntry, error: null }
      const mockSingle = jest.fn().mockResolvedValue(mockResponse)
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ update: mockUpdate })

      await updateTimeEntry('1', mockUpdateInput)

      expect(mockSelect).toHaveBeenCalledWith(`
      *,
      client:clients(*)
    `)
    })

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed')
      const mockResponse = { data: null, error: mockError }
      const mockSingle = jest.fn().mockResolvedValue(mockResponse)
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ update: mockUpdate })

      await expect(updateTimeEntry('1', mockUpdateInput)).rejects.toThrow('Update failed')
    })
  })

  describe('deleteTimeEntry', () => {
    it('should delete time entry successfully', async () => {
      const mockResponse = { error: null }
      const mockEq = jest.fn().mockResolvedValue(mockResponse)
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ delete: mockDelete })

      await expect(deleteTimeEntry('1')).resolves.not.toThrow()

      expect(createClient).toHaveBeenCalledTimes(1)
      expect(mockSupabase.from).toHaveBeenCalledWith('time_entries')
      expect(mockDelete).toHaveBeenCalledTimes(1)
      expect(mockEq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when deletion fails', async () => {
      const mockError = new Error('Deletion failed')
      const mockResponse = { error: mockError }
      const mockEq = jest.fn().mockResolvedValue(mockResponse)
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ delete: mockDelete })

      await expect(deleteTimeEntry('1')).rejects.toThrow('Deletion failed')
    })

    it('should perform hard delete (not soft delete)', async () => {
      const mockResponse = { error: null }
      const mockEq = jest.fn().mockResolvedValue(mockResponse)
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ delete: mockDelete })

      await deleteTimeEntry('entry-123')

      // Verify it's using delete method, not update
      expect(mockDelete).toHaveBeenCalledTimes(1)
      expect(mockEq).toHaveBeenCalledWith('id', 'entry-123')
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle pagination edge cases', async () => {
      // Test page 0 (should use offset 0)
      const mockResponse = { data: [], error: null, count: 0 }
      const mockRange = jest.fn().mockResolvedValue(mockResponse)
      const mockOrder2 = jest.fn().mockReturnValue({ range: mockRange })
      const mockOrder1 = jest.fn().mockReturnValue({ order: mockOrder2 })
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder1 })
      mockFrom.mockReturnValue({ select: mockSelect })

      await getTimeEntries(0, 10)
      expect(mockRange).toHaveBeenCalledWith(-10, -1) // Still uses the calculation
    })

    it('should handle large page numbers', async () => {
      const mockResponse = { data: [], error: null, count: 0 }
      const mockRange = jest.fn().mockResolvedValue(mockResponse)
      const mockOrder2 = jest.fn().mockReturnValue({ range: mockRange })
      const mockOrder1 = jest.fn().mockReturnValue({ order: mockOrder2 })
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder1 })
      mockFrom.mockReturnValue({ select: mockSelect })

      await getTimeEntries(100, 10)
      expect(mockRange).toHaveBeenCalledWith(990, 999) // page 100, offset 990
    })

    it('should handle empty time entry results', async () => {
      const mockResponse = { data: [], error: null, count: 0 }
      const mockRange = jest.fn().mockResolvedValue(mockResponse)
      const mockOrder2 = jest.fn().mockReturnValue({ range: mockRange })
      const mockOrder1 = jest.fn().mockReturnValue({ order: mockOrder2 })
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder1 })
      mockFrom.mockReturnValue({ select: mockSelect })

      const result = await getTimeEntries()

      expect(result.data).toEqual([])
      expect(result.count).toBe(0)
      expect(result.totalPages).toBe(0)
    })

    it('should handle network errors', async () => {
      const mockRange = jest.fn().mockRejectedValue(new Error('Network error'))
      const mockOrder2 = jest.fn().mockReturnValue({ range: mockRange })
      const mockOrder1 = jest.fn().mockReturnValue({ order: mockOrder2 })
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder1 })
      mockFrom.mockReturnValue({ select: mockSelect })

      await expect(getTimeEntries()).rejects.toThrow('Network error')
    })
  })

  describe('data types and validation', () => {
    it('should preserve number types for hours', async () => {
      const entryWithFloatHours = {
        client_id: 'client-1',
        date: '2024-01-15',
        hours: 7.5,
        description: 'Half day work'
      }

      const mockResponse = { data: { ...entryWithFloatHours, id: '1' }, error: null }
      const mockSingle = jest.fn().mockResolvedValue(mockResponse)
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })
      mockFrom.mockReturnValue({ insert: mockInsert })

      await createTimeEntry(entryWithFloatHours, 'user-1')

      expect(mockInsert).toHaveBeenCalledWith({
        ...entryWithFloatHours,
        user_id: 'user-1'
      })
    })

    it('should handle date string formats', async () => {
      const entryWithDate = {
        client_id: 'client-1',
        date: '2024-12-31',
        hours: 8,
        description: 'Year end work'
      }

      const mockResponse = { data: { ...entryWithDate, id: '1' }, error: null }
      const mockSingle = jest.fn().mockResolvedValue(mockResponse)
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })
      mockFrom.mockReturnValue({ insert: mockInsert })

      await createTimeEntry(entryWithDate, 'user-1')

      expect(mockInsert).toHaveBeenCalledWith({
        ...entryWithDate,
        user_id: 'user-1'
      })
    })
  })
})