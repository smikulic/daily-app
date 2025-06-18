import { useState, useCallback } from 'react'
import { getTimeEntries } from '@/services/timeEntries'
import { TimeEntry } from '@/types/database'

export interface ReportFilters {
  clientIds: string[]
  year: number
  month?: number // Optional for yearly reports
}

export interface MonthlyReport {
  month: number
  monthName: string
  totalHours: number
  totalAmount: number
  entriesCount: number
}

export interface ClientReport {
  clientId: string
  clientName: string
  totalHours: number
  totalAmount: number
  entriesCount: number
}

export interface ReportSummary {
  totalHours: number
  totalAmount: number
  entriesCount: number
  monthlyReports: MonthlyReport[]
  clientReports: ClientReport[]
}

export function useReports() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReport = useCallback(async (filters: ReportFilters): Promise<ReportSummary | null> => {
    try {
      setLoading(true)
      setError(null)

      // Get all time entries for the year (we'll filter in memory for better performance with small datasets)
      const startDate = new Date(filters.year, 0, 1)
      const endDate = new Date(filters.year + 1, 0, 1)
      
      // Fetch all entries for the year - we'll need to implement date filtering in the service
      // For now, we'll get all entries and filter client-side
      let allEntries: TimeEntry[] = []
      let page = 1
      let hasMore = true
      
      while (hasMore) {
        const result = await getTimeEntries(page, 100) // Large page size
        allEntries = [...allEntries, ...result.data]
        hasMore = page < result.totalPages
        page++
      }

      // Filter entries by date range and clients
      const filteredEntries = allEntries.filter(entry => {
        const entryDate = new Date(entry.date)
        const inDateRange = entryDate >= startDate && entryDate < endDate
        const inClientFilter = filters.clientIds.length === 0 || filters.clientIds.includes(entry.client_id)
        const inMonthFilter = !filters.month || entryDate.getMonth() + 1 === filters.month
        
        return inDateRange && inClientFilter && inMonthFilter
      })

      // Calculate summary
      const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0)
      const totalAmount = filteredEntries.reduce((sum, entry) => {
        if (entry.client) {
          return sum + (entry.hours * entry.client.hourly_rate)
        }
        return sum
      }, 0)

      // Generate monthly reports (only if not filtering by specific month)
      const monthlyReports: MonthlyReport[] = []
      if (!filters.month) {
        for (let month = 1; month <= 12; month++) {
          const monthEntries = filteredEntries.filter(entry => {
            const entryDate = new Date(entry.date)
            return entryDate.getMonth() + 1 === month
          })

          const monthTotalHours = monthEntries.reduce((sum, entry) => sum + entry.hours, 0)
          const monthTotalAmount = monthEntries.reduce((sum, entry) => {
            if (entry.client) {
              return sum + (entry.hours * entry.client.hourly_rate)
            }
            return sum
          }, 0)

          monthlyReports.push({
            month,
            monthName: new Date(filters.year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' }),
            totalHours: monthTotalHours,
            totalAmount: monthTotalAmount,
            entriesCount: monthEntries.length
          })
        }
      }

      // Generate client reports
      const clientMap = new Map<string, ClientReport>()
      filteredEntries.forEach(entry => {
        if (!entry.client) return

        const existing = clientMap.get(entry.client_id) || {
          clientId: entry.client_id,
          clientName: entry.client.name,
          totalHours: 0,
          totalAmount: 0,
          entriesCount: 0
        }

        existing.totalHours += entry.hours
        existing.totalAmount += entry.hours * entry.client.hourly_rate
        existing.entriesCount += 1

        clientMap.set(entry.client_id, existing)
      })

      const clientReports = Array.from(clientMap.values()).sort((a, b) => b.totalAmount - a.totalAmount)

      return {
        totalHours,
        totalAmount,
        entriesCount: filteredEntries.length,
        monthlyReports,
        clientReports
      }
    } catch (err) {
      setError('Failed to generate report')
      console.error('Error generating report:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getDetailedEntries = useCallback(async (filters: ReportFilters): Promise<TimeEntry[]> => {
    try {
      setLoading(true)
      setError(null)

      // Get all time entries for the specified period
      let allEntries: TimeEntry[] = []
      let page = 1
      let hasMore = true
      
      while (hasMore) {
        const result = await getTimeEntries(page, 100)
        allEntries = [...allEntries, ...result.data]
        hasMore = page < result.totalPages
        page++
      }

      // Filter entries by date range and clients
      const startDate = new Date(filters.year, 0, 1)
      const endDate = new Date(filters.year + 1, 0, 1)
      
      const filteredEntries = allEntries.filter(entry => {
        const entryDate = new Date(entry.date)
        const inDateRange = entryDate >= startDate && entryDate < endDate
        const inClientFilter = filters.clientIds.length === 0 || filters.clientIds.includes(entry.client_id)
        const inMonthFilter = !filters.month || entryDate.getMonth() + 1 === filters.month
        
        return inDateRange && inClientFilter && inMonthFilter
      })

      return filteredEntries
    } catch (err) {
      setError('Failed to fetch detailed entries')
      console.error('Error fetching detailed entries:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    generateReport,
    getDetailedEntries
  }
}