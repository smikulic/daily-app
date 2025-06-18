import { useState, useCallback } from 'react'
import { getTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry } from '@/services/timeEntries'
import { TimeEntry, CreateTimeEntryInput, UpdateTimeEntryInput } from '@/types/database'

export function useTimeEntries() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadTimeEntries = useCallback(async (currentPage = page, limit = 10) => {
    try {
      setLoading(true)
      setError(null)
      const result = await getTimeEntries(currentPage, limit)
      setTimeEntries(result.data)
      setTotalPages(result.totalPages)
      setPage(currentPage)
    } catch (err) {
      setError('Failed to load time entries')
      console.error('Error loading time entries:', err)
    } finally {
      setLoading(false)
    }
  }, [page])

  const createEntry = useCallback(async (data: CreateTimeEntryInput, userId: string) => {
    try {
      await createTimeEntry(data, userId)
      await loadTimeEntries(page) // Refresh current page
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = 'Failed to create time entry'
      console.error('Error creating time entry:', err)
      return { success: false, error: errorMessage }
    }
  }, [loadTimeEntries, page])

  const updateEntry = useCallback(async (id: string, data: UpdateTimeEntryInput) => {
    try {
      await updateTimeEntry(id, data)
      await loadTimeEntries(page) // Refresh current page
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = 'Failed to update time entry'
      console.error('Error updating time entry:', err)
      return { success: false, error: errorMessage }
    }
  }, [loadTimeEntries, page])

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await deleteTimeEntry(id)
      await loadTimeEntries(page) // Refresh current page
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = 'Failed to delete time entry'
      console.error('Error deleting time entry:', err)
      return { success: false, error: errorMessage }
    }
  }, [loadTimeEntries, page])

  const goToPage = useCallback(async (newPage: number) => {
    await loadTimeEntries(newPage)
  }, [loadTimeEntries])

  return {
    timeEntries,
    loading,
    error,
    page,
    totalPages,
    loadTimeEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    goToPage,
  }
}