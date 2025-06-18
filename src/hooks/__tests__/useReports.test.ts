import { renderHook, act } from '@testing-library/react'
import { useReports, ReportFilters } from '../useReports'
import * as timeEntriesService from '@/services/timeEntries'
import { TimeEntry } from '@/types/database'

// Mock the timeEntries service
jest.mock('@/services/timeEntries', () => ({
  getTimeEntries: jest.fn()
}))

describe('useReports', () => {
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
      date: '2024-02-14',
      hours: 6,
      description: 'Backend API',
      client_id: 'client-2',
      user_id: 'user-1',
      created_at: '2024-02-14T00:00:00Z',
      updated_at: '2024-02-14T00:00:00Z',
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
    },
    {
      id: '3',
      date: '2024-01-20',
      hours: 4,
      description: 'More work for TechCorp',
      client_id: 'client-1',
      user_id: 'user-1',
      created_at: '2024-01-20T00:00:00Z',
      updated_at: '2024-01-20T00:00:00Z',
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
  ]

  const mockServiceResponse = {
    data: mockTimeEntries,
    count: 3,
    page: 1,
    limit: 100,
    totalPages: 1
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
      const { result } = renderHook(() => useReports())

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(typeof result.current.generateReport).toBe('function')
      expect(typeof result.current.getDetailedEntries).toBe('function')
    })
  })

  describe('generateReport', () => {
    const filters: ReportFilters = {
      clientIds: [],
      year: 2024
    }

    it('should generate yearly report successfully', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue(mockServiceResponse)

      const { result } = renderHook(() => useReports())

      let reportResult: any

      await act(async () => {
        reportResult = await result.current.generateReport(filters)
      })

      expect(timeEntriesService.getTimeEntries).toHaveBeenCalledWith(1, 100)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      
      expect(reportResult).toEqual({
        totalHours: 18, // 8 + 6 + 4
        totalAmount: 1560, // (8 + 4) * 85 + 6 * 90
        entriesCount: 3,
        monthlyReports: expect.arrayContaining([
          expect.objectContaining({
            month: 1,
            monthName: 'January',
            totalHours: 12,
            totalAmount: 1020,
            entriesCount: 2
          }),
          expect.objectContaining({
            month: 2,
            monthName: 'February',
            totalHours: 6,
            totalAmount: 540,
            entriesCount: 1
          })
        ]),
        clientReports: expect.arrayContaining([
          expect.objectContaining({
            clientId: 'client-1',
            clientName: 'TechCorp',
            totalHours: 12,
            totalAmount: 1020,
            entriesCount: 2
          }),
          expect.objectContaining({
            clientId: 'client-2',
            clientName: 'StartupXYZ',
            totalHours: 6,
            totalAmount: 540,
            entriesCount: 1
          })
        ])
      })
    })

    it('should generate monthly report when month filter is specified', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue(mockServiceResponse)

      const { result } = renderHook(() => useReports())

      const monthlyFilters: ReportFilters = {
        clientIds: [],
        year: 2024,
        month: 1
      }

      let reportResult: any

      await act(async () => {
        reportResult = await result.current.generateReport(monthlyFilters)
      })

      expect(reportResult.totalHours).toBe(12) // Only January entries
      expect(reportResult.totalAmount).toBe(1020)
      expect(reportResult.entriesCount).toBe(2)
      expect(reportResult.monthlyReports).toEqual([]) // No monthly breakdown for specific month
    })

    it('should filter by client IDs when specified', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue(mockServiceResponse)

      const { result } = renderHook(() => useReports())

      const clientFilters: ReportFilters = {
        clientIds: ['client-1'],
        year: 2024
      }

      let reportResult: any

      await act(async () => {
        reportResult = await result.current.generateReport(clientFilters)
      })

      expect(reportResult.totalHours).toBe(12) // Only client-1 entries
      expect(reportResult.totalAmount).toBe(1020)
      expect(reportResult.entriesCount).toBe(2)
      expect(reportResult.clientReports).toHaveLength(1)
      expect(reportResult.clientReports[0].clientName).toBe('TechCorp')
    })

    it('should handle multiple pages of data', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock)
        .mockResolvedValueOnce({
          data: [mockTimeEntries[0]],
          count: 2,
          page: 1,
          limit: 100,
          totalPages: 2
        })
        .mockResolvedValueOnce({
          data: [mockTimeEntries[1]],
          count: 2,
          page: 2,
          limit: 100,
          totalPages: 2
        })

      const { result } = renderHook(() => useReports())

      let reportResult: any

      await act(async () => {
        reportResult = await result.current.generateReport(filters)
      })

      expect(timeEntriesService.getTimeEntries).toHaveBeenCalledTimes(2)
      expect(timeEntriesService.getTimeEntries).toHaveBeenNthCalledWith(1, 1, 100)
      expect(timeEntriesService.getTimeEntries).toHaveBeenNthCalledWith(2, 2, 100)
      expect(reportResult.entriesCount).toBe(2)
    })

    it('should handle loading state correctly', async () => {
      let resolvePromise: (value: typeof mockServiceResponse) => void
      const promise = new Promise<typeof mockServiceResponse>((resolve) => {
        resolvePromise = resolve
      })

      ;(timeEntriesService.getTimeEntries as jest.Mock).mockReturnValue(promise)

      const { result } = renderHook(() => useReports())

      act(() => {
        result.current.generateReport(filters)
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe(null)

      await act(async () => {
        resolvePromise(mockServiceResponse)
        await promise
      })

      expect(result.current.loading).toBe(false)
    })

    it('should handle errors when generating report fails', async () => {
      const error = new Error('Failed to fetch data')
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockRejectedValue(error)

      const { result } = renderHook(() => useReports())

      let reportResult: any

      await act(async () => {
        reportResult = await result.current.generateReport(filters)
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Failed to generate report')
      expect(reportResult).toBe(null)
      expect(console.error).toHaveBeenCalledWith('Error generating report:', error)
    })

    it('should reset error state on successful generation', async () => {
      // First call fails
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useReports())

      await act(async () => {
        await result.current.generateReport(filters)
      })

      expect(result.current.error).toBe('Failed to generate report')

      // Second call succeeds
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValueOnce(mockServiceResponse)

      await act(async () => {
        await result.current.generateReport(filters)
      })

      expect(result.current.error).toBe(null)
    })

    it('should handle entries without client data gracefully', async () => {
      const entriesWithoutClient = [
        {
          ...mockTimeEntries[0],
          client: undefined
        }
      ]

      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue({
        ...mockServiceResponse,
        data: entriesWithoutClient
      })

      const { result } = renderHook(() => useReports())

      let reportResult: any

      await act(async () => {
        reportResult = await result.current.generateReport(filters)
      })

      expect(reportResult.totalHours).toBe(8)
      expect(reportResult.totalAmount).toBe(0) // No client means no hourly rate
      expect(reportResult.clientReports).toEqual([])
    })

    it('should sort client reports by total amount descending', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue(mockServiceResponse)

      const { result } = renderHook(() => useReports())

      let reportResult: any

      await act(async () => {
        reportResult = await result.current.generateReport(filters)
      })

      const clientReports = reportResult.clientReports
      expect(clientReports[0].clientName).toBe('TechCorp') // Higher total amount (1020)
      expect(clientReports[1].clientName).toBe('StartupXYZ') // Lower total amount (540)
    })

    it('should generate correct monthly reports for all 12 months', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue(mockServiceResponse)

      const { result } = renderHook(() => useReports())

      let reportResult: any

      await act(async () => {
        reportResult = await result.current.generateReport(filters)
      })

      expect(reportResult.monthlyReports).toHaveLength(12)
      
      // Check that months with no data have zero values
      const marchReport = reportResult.monthlyReports.find((m: any) => m.month === 3)
      expect(marchReport).toEqual({
        month: 3,
        monthName: 'March',
        totalHours: 0,
        totalAmount: 0,
        entriesCount: 0
      })
    })
  })

  describe('getDetailedEntries', () => {
    const filters: ReportFilters = {
      clientIds: [],
      year: 2024
    }

    it('should get detailed entries successfully', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue(mockServiceResponse)

      const { result } = renderHook(() => useReports())

      let detailedEntries: TimeEntry[] = []

      await act(async () => {
        detailedEntries = await result.current.getDetailedEntries(filters)
      })

      expect(timeEntriesService.getTimeEntries).toHaveBeenCalledWith(1, 100)
      expect(detailedEntries).toHaveLength(3)
      expect(detailedEntries).toEqual(mockTimeEntries)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should filter entries by date range', async () => {
      const entriesWithDifferentYears = [
        ...mockTimeEntries,
        {
          ...mockTimeEntries[0],
          id: '4',
          date: '2023-12-15' // Different year
        }
      ]

      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue({
        ...mockServiceResponse,
        data: entriesWithDifferentYears
      })

      const { result } = renderHook(() => useReports())

      let detailedEntries: TimeEntry[] = []

      await act(async () => {
        detailedEntries = await result.current.getDetailedEntries(filters)
      })

      expect(detailedEntries).toHaveLength(3) // Should exclude 2023 entry
      expect(detailedEntries.every(entry => entry.date.startsWith('2024'))).toBe(true)
    })

    it('should filter entries by client IDs', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue(mockServiceResponse)

      const { result } = renderHook(() => useReports())

      const clientFilters: ReportFilters = {
        clientIds: ['client-1'],
        year: 2024
      }

      let detailedEntries: TimeEntry[] = []

      await act(async () => {
        detailedEntries = await result.current.getDetailedEntries(clientFilters)
      })

      expect(detailedEntries).toHaveLength(2) // Only client-1 entries
      expect(detailedEntries.every(entry => entry.client_id === 'client-1')).toBe(true)
    })

    it('should filter entries by month when specified', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue(mockServiceResponse)

      const { result } = renderHook(() => useReports())

      const monthlyFilters: ReportFilters = {
        clientIds: [],
        year: 2024,
        month: 1
      }

      let detailedEntries: TimeEntry[] = []

      await act(async () => {
        detailedEntries = await result.current.getDetailedEntries(monthlyFilters)
      })

      expect(detailedEntries).toHaveLength(2) // Only January entries
      expect(detailedEntries.every(entry => {
        const date = new Date(entry.date)
        return date.getMonth() + 1 === 1
      })).toBe(true)
    })

    it('should handle multiple pages of data', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock)
        .mockResolvedValueOnce({
          data: [mockTimeEntries[0]],
          count: 2,
          page: 1,
          limit: 100,
          totalPages: 2
        })
        .mockResolvedValueOnce({
          data: [mockTimeEntries[1]],
          count: 2,
          page: 2,
          limit: 100,
          totalPages: 2
        })

      const { result } = renderHook(() => useReports())

      let detailedEntries: TimeEntry[] = []

      await act(async () => {
        detailedEntries = await result.current.getDetailedEntries(filters)
      })

      expect(timeEntriesService.getTimeEntries).toHaveBeenCalledTimes(2)
      expect(detailedEntries).toHaveLength(2)
    })

    it('should handle errors when fetching detailed entries fails', async () => {
      const error = new Error('Failed to fetch entries')
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockRejectedValue(error)

      const { result } = renderHook(() => useReports())

      let detailedEntries: TimeEntry[] = []

      await act(async () => {
        detailedEntries = await result.current.getDetailedEntries(filters)
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Failed to fetch detailed entries')
      expect(detailedEntries).toEqual([])
      expect(console.error).toHaveBeenCalledWith('Error fetching detailed entries:', error)
    })
  })

  describe('date filtering edge cases', () => {
    it('should handle leap year correctly', async () => {
      const leapYearEntry = {
        ...mockTimeEntries[0],
        id: '4',
        date: '2024-02-29' // Leap year date
      }

      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue({
        ...mockServiceResponse,
        data: [leapYearEntry]
      })

      const { result } = renderHook(() => useReports())

      const filters: ReportFilters = {
        clientIds: [],
        year: 2024
      }

      let reportResult: any

      await act(async () => {
        reportResult = await result.current.generateReport(filters)
      })

      expect(reportResult.entriesCount).toBe(1)
      expect(reportResult.monthlyReports[1].entriesCount).toBe(1) // February
    })

    it('should handle year boundaries correctly', async () => {
      const boundaryEntries = [
        { ...mockTimeEntries[0], id: '1', date: '2024-01-01' }, // First day of year
        { ...mockTimeEntries[0], id: '2', date: '2024-12-31' }, // Last day of year
        { ...mockTimeEntries[0], id: '3', date: '2023-12-31' }, // Previous year
        { ...mockTimeEntries[0], id: '4', date: '2025-01-01' }  // Next year
      ]

      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue({
        ...mockServiceResponse,
        data: boundaryEntries
      })

      const { result } = renderHook(() => useReports())

      const filters: ReportFilters = {
        clientIds: [],
        year: 2024
      }

      let detailedEntries: TimeEntry[] = []

      await act(async () => {
        detailedEntries = await result.current.getDetailedEntries(filters)
      })

      expect(detailedEntries).toHaveLength(2) // Only 2024 entries
      expect(detailedEntries.every(entry => entry.date.startsWith('2024'))).toBe(true)
    })
  })

  describe('callback stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useReports())

      const initialCallbacks = {
        generateReport: result.current.generateReport,
        getDetailedEntries: result.current.getDetailedEntries
      }

      rerender()

      expect(result.current.generateReport).toBe(initialCallbacks.generateReport)
      expect(result.current.getDetailedEntries).toBe(initialCallbacks.getDetailedEntries)
    })
  })

  describe('concurrent operations', () => {
    it('should handle concurrent report generation and detail fetching', async () => {
      ;(timeEntriesService.getTimeEntries as jest.Mock).mockResolvedValue(mockServiceResponse)

      const { result } = renderHook(() => useReports())

      const filters: ReportFilters = {
        clientIds: [],
        year: 2024
      }

      await act(async () => {
        await Promise.all([
          result.current.generateReport(filters),
          result.current.getDetailedEntries(filters)
        ])
      })

      expect(timeEntriesService.getTimeEntries).toHaveBeenCalledTimes(2)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })
})