import { renderHook, act } from '@testing-library/react'
import { useTimeEntries } from '../useTimeEntries'
import * as timeEntriesService from '@/services/timeEntries'
import { TimeEntry, CreateTimeEntryInput, UpdateTimeEntryInput } from '@/types/database'

// Mock the timeEntries service
jest.mock('@/services/timeEntries', () => ({
  getTimeEntries: jest.fn(),
  createTimeEntry: jest.fn(),
  updateTimeEntry: jest.fn(),
  deleteTimeEntry: jest.fn()
}))

describe('useTimeEntries', () => {
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

  const mockServiceResponse = {
    data: mockTimeEntries,
    count: 25,
    page: 1,
    limit: 10,
    totalPages: 3
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useTimeEntries())

      expect(result.current.timeEntries).toEqual([])
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe(null)
      expect(result.current.page).toBe(1)
      expect(result.current.totalPages).toBe(1)
      expect(typeof result.current.loadTimeEntries).toBe('function')
      expect(typeof result.current.createEntry).toBe('function')
      expect(typeof result.current.updateEntry).toBe('function')
      expect(typeof result.current.deleteEntry).toBe('function')
      expect(typeof result.current.goToPage).toBe('function')
    })
  })

  describe('loadTimeEntries', () => {
    it('should load time entries successfully with default parameters', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue(mockServiceResponse)

      const { result } = renderHook(() => useTimeEntries())

      await act(async () => {
        await result.current.loadTimeEntries()
      })

      expect(timeEntriesService.getTimeEntries).toHaveBeenCalledWith(1, 10)
      expect(result.current.timeEntries).toEqual(mockTimeEntries)
      expect(result.current.page).toBe(1)
      expect(result.current.totalPages).toBe(3)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should load time entries with custom page and limit', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue({
        ...mockServiceResponse,
        page: 2,
        limit: 20
      })

      const { result } = renderHook(() => useTimeEntries())

      await act(async () => {
        await result.current.loadTimeEntries(2, 20)
      })

      expect(timeEntriesService.getTimeEntries).toHaveBeenCalledWith(2, 20)
      expect(result.current.page).toBe(2)
    })

    it('should handle loading state correctly', async () => {
      let resolvePromise: (value: typeof mockServiceResponse) => void
      const promise = new Promise<typeof mockServiceResponse>((resolve) => {
        resolvePromise = resolve
      })

      ;(timeEntriesService.getTimeEntries as jest.Mock).mockReturnValue(promise)

      const { result } = renderHook(() => useTimeEntries())

      act(() => {
        result.current.loadTimeEntries()
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe(null)

      await act(async () => {
        resolvePromise(mockServiceResponse)
        await promise
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.timeEntries).toEqual(mockTimeEntries)
    })

    it('should handle errors when loading time entries fails', async () => {
      const error = new Error('Failed to fetch time entries')
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockRejectedValue(error)

      const { result } = renderHook(() => useTimeEntries())

      await act(async () => {
        await result.current.loadTimeEntries()
      })

      expect(result.current.timeEntries).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Failed to load time entries')
      expect(console.error).toHaveBeenCalledWith('Error loading time entries:', error)
    })

    it('should reset error state on successful load', async () => {
      // First call fails
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useTimeEntries())

      await act(async () => {
        await result.current.loadTimeEntries()
      })

      expect(result.current.error).toBe('Failed to load time entries')

      // Second call succeeds
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValueOnce(mockServiceResponse)

      await act(async () => {
        await result.current.loadTimeEntries()
      })

      expect(result.current.error).toBe(null)
      expect(result.current.timeEntries).toEqual(mockTimeEntries)
    })
  })

  describe('createEntry', () => {
    const mockInput: CreateTimeEntryInput = {
      client_id: 'client-1',
      date: '2024-01-16',
      hours: 4,
      description: 'Bug fixes'
    }

    it('should create time entry successfully and refresh current page', async () => {
      ;(timeEntriesService.createTimeEntry as jest.Mock).mockResolvedValue(mockTimeEntries[0])
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue(mockServiceResponse)

      const { result } = renderHook(() => useTimeEntries())

      let createResult: { success: boolean; error: string | null } | undefined

      await act(async () => {
        createResult = await result.current.createEntry(mockInput, 'user-1')
      })

      expect(timeEntriesService.createTimeEntry).toHaveBeenCalledWith(mockInput, 'user-1')
      expect(timeEntriesService.getTimeEntries).toHaveBeenCalledWith(1, 10)
      expect(createResult).toEqual({ success: true, error: null })
    })

    it('should handle creation errors', async () => {
      const error = new Error('Creation failed')
      ;(timeEntriesService.createTimeEntry as jest.Mock).mockRejectedValue(error)

      const { result } = renderHook(() => useTimeEntries())

      let createResult: { success: boolean; error: string | null } | undefined

      await act(async () => {
        createResult = await result.current.createEntry(mockInput, 'user-1')
      })

      expect(createResult).toEqual({ success: false, error: 'Failed to create time entry' })
      expect(console.error).toHaveBeenCalledWith('Error creating time entry:', error)
      expect(timeEntriesService.getTimeEntries).not.toHaveBeenCalled()
    })

    it('should refresh the current page after creation', async () => {
      ;(timeEntriesService.createTimeEntry as jest.Mock).mockResolvedValue(mockTimeEntries[0])
      ;(timeEntriesService.getTimeEntries as jest.Mock)
        .mockResolvedValueOnce({ ...mockServiceResponse, page: 2 }) // Initial load page 2
        .mockResolvedValueOnce({ ...mockServiceResponse, page: 2 }) // Refresh page 2

      const { result } = renderHook(() => useTimeEntries())

      // Load page 2 first
      await act(async () => {
        await result.current.loadTimeEntries(2, 10)
      })

      expect(result.current.page).toBe(2)

      // Create entry should refresh page 2
      await act(async () => {
        await result.current.createEntry(mockInput, 'user-1')
      })

      expect(timeEntriesService.getTimeEntries).toHaveBeenLastCalledWith(2, 10)
    })
  })

  describe('updateEntry', () => {
    const mockUpdateInput: UpdateTimeEntryInput = {
      hours: 7,
      description: 'Updated description'
    }

    it('should update time entry successfully and refresh current page', async () => {
      ;(timeEntriesService.updateTimeEntry as jest.Mock).mockResolvedValue(mockTimeEntries[0])
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue(mockServiceResponse)

      const { result } = renderHook(() => useTimeEntries())

      let updateResult: { success: boolean; error: string | null } | undefined

      await act(async () => {
        updateResult = await result.current.updateEntry('1', mockUpdateInput)
      })

      expect(timeEntriesService.updateTimeEntry).toHaveBeenCalledWith('1', mockUpdateInput)
      expect(timeEntriesService.getTimeEntries).toHaveBeenCalledWith(1, 10)
      expect(updateResult).toEqual({ success: true, error: null })
    })

    it('should handle update errors', async () => {
      const error = new Error('Update failed')
      ;(timeEntriesService.updateTimeEntry as jest.Mock).mockRejectedValue(error)

      const { result } = renderHook(() => useTimeEntries())

      let updateResult: { success: boolean; error: string | null } | undefined

      await act(async () => {
        updateResult = await result.current.updateEntry('1', mockUpdateInput)
      })

      expect(updateResult).toEqual({ success: false, error: 'Failed to update time entry' })
      expect(console.error).toHaveBeenCalledWith('Error updating time entry:', error)
      expect(timeEntriesService.getTimeEntries).not.toHaveBeenCalled()
    })
  })

  describe('deleteEntry', () => {
    it('should delete time entry successfully and refresh current page', async () => {
      ;(timeEntriesService.deleteTimeEntry as jest.Mock).mockResolvedValue(undefined)
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue(mockServiceResponse)

      const { result } = renderHook(() => useTimeEntries())

      let deleteResult: { success: boolean; error: string | null } | undefined

      await act(async () => {
        deleteResult = await result.current.deleteEntry('1')
      })

      expect(timeEntriesService.deleteTimeEntry).toHaveBeenCalledWith('1')
      expect(timeEntriesService.getTimeEntries).toHaveBeenCalledWith(1, 10)
      expect(deleteResult).toEqual({ success: true, error: null })
    })

    it('should handle deletion errors', async () => {
      const error = new Error('Deletion failed')
      ;(timeEntriesService.deleteTimeEntry as jest.Mock).mockRejectedValue(error)

      const { result } = renderHook(() => useTimeEntries())

      let deleteResult: { success: boolean; error: string | null } | undefined

      await act(async () => {
        deleteResult = await result.current.deleteEntry('1')
      })

      expect(deleteResult).toEqual({ success: false, error: 'Failed to delete time entry' })
      expect(console.error).toHaveBeenCalledWith('Error deleting time entry:', error)
      expect(timeEntriesService.getTimeEntries).not.toHaveBeenCalled()
    })
  })

  describe('goToPage', () => {
    it('should navigate to specified page', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue({
        ...mockServiceResponse,
        page: 3
      })

      const { result } = renderHook(() => useTimeEntries())

      await act(async () => {
        await result.current.goToPage(3)
      })

      expect(timeEntriesService.getTimeEntries).toHaveBeenCalledWith(3, 10)
      expect(result.current.page).toBe(3)
    })

    it('should handle page navigation errors', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockRejectedValue(new Error('Page load failed'))

      const { result } = renderHook(() => useTimeEntries())

      await act(async () => {
        await result.current.goToPage(5)
      })

      expect(result.current.error).toBe('Failed to load time entries')
      expect(result.current.loading).toBe(false)
    })
  })

  describe('pagination state management', () => {
    it('should maintain page state correctly through operations', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock)
        .mockResolvedValueOnce({ ...mockServiceResponse, page: 2 })
        .mockResolvedValueOnce({ ...mockServiceResponse, page: 2 })

      const { result } = renderHook(() => useTimeEntries())

      // Navigate to page 2
      await act(async () => {
        await result.current.goToPage(2)
      })

      expect(result.current.page).toBe(2)

      // Create entry should stay on page 2
      ;(timeEntriesService.createTimeEntry as jest.Mock).mockResolvedValue(mockTimeEntries[0])

      await act(async () => {
        await result.current.createEntry({
          client_id: 'client-1',
          date: '2024-01-16',
          hours: 4,
          description: 'Test'
        }, 'user-1')
      })

      expect(timeEntriesService.getTimeEntries).toHaveBeenLastCalledWith(2, 10)
      expect(result.current.page).toBe(2)
    })
  })

  describe('callback dependencies', () => {
    it('should maintain stable function references with same dependencies', () => {
      const { result, rerender } = renderHook(() => useTimeEntries())

      const initialCallbacks = {
        loadTimeEntries: result.current.loadTimeEntries,
        createEntry: result.current.createEntry,
        updateEntry: result.current.updateEntry,
        deleteEntry: result.current.deleteEntry,
        goToPage: result.current.goToPage
      }

      rerender()

      expect(result.current.loadTimeEntries).toBe(initialCallbacks.loadTimeEntries)
      expect(result.current.createEntry).toBe(initialCallbacks.createEntry)
      expect(result.current.updateEntry).toBe(initialCallbacks.updateEntry)
      expect(result.current.deleteEntry).toBe(initialCallbacks.deleteEntry)
      expect(result.current.goToPage).toBe(initialCallbacks.goToPage)
    })

    it('should update callbacks when page dependency changes', async () => {
      const { result } = renderHook(() => useTimeEntries())

      const initialCreateEntry = result.current.createEntry

      // Change page
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue({
        ...mockServiceResponse,
        page: 2
      })

      await act(async () => {
        await result.current.goToPage(2)
      })

      // createEntry callback should be different due to page dependency change
      expect(result.current.createEntry).not.toBe(initialCreateEntry)
    })
  })

  describe('error scenarios', () => {
    it('should handle network errors gracefully', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useTimeEntries())

      await act(async () => {
        await result.current.loadTimeEntries()
      })

      expect(result.current.error).toBe('Failed to load time entries')
      expect(result.current.loading).toBe(false)
      expect(result.current.timeEntries).toEqual([])
    })

    it('should handle empty result sets', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue({
        data: [],
        count: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      })

      const { result } = renderHook(() => useTimeEntries())

      await act(async () => {
        await result.current.loadTimeEntries()
      })

      expect(result.current.timeEntries).toEqual([])
      expect(result.current.totalPages).toBe(0)
      expect(result.current.error).toBe(null)
    })
  })

  describe('concurrent operations', () => {
    it('should handle multiple concurrent operations gracefully', async () => {
      ;(timeEntriesService.createTimeEntry as jest.Mock).mockResolvedValue(mockTimeEntries[0])
      ;(timeEntriesService.updateTimeEntry as jest.Mock).mockResolvedValue(mockTimeEntries[1])
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue(mockServiceResponse)

      const { result } = renderHook(() => useTimeEntries())

      await act(async () => {
        await Promise.all([
          result.current.createEntry({
            client_id: 'client-1',
            date: '2024-01-16',
            hours: 4,
            description: 'Test 1'
          }, 'user-1'),
          result.current.updateEntry('2', {
            hours: 5,
            description: 'Updated'
          })
        ])
      })

      expect(timeEntriesService.createTimeEntry).toHaveBeenCalledTimes(1)
      expect(timeEntriesService.updateTimeEntry).toHaveBeenCalledTimes(1)
      expect(timeEntriesService.getTimeEntries).toHaveBeenCalledTimes(2)
    })
  })
})