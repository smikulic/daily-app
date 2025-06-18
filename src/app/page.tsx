'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry } from '@/services/timeEntries'
import { getClients } from '@/services/clients'
import { TimeEntry, Client, CreateTimeEntryInput, UpdateTimeEntryInput } from '@/types/database'
import { Notification } from '@/components/Notification'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<CreateTimeEntryInput>({
    client_id: '',
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    description: ''
  })

  useEffect(() => {
    loadClients()
    loadTimeEntries()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadTimeEntries()
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadTimeEntries() {
    try {
      setLoading(true)
      const result = await getTimeEntries(page, 10)
      setTimeEntries(result.data)
      setTotalPages(result.totalPages)
    } catch {
      setNotification({ type: 'error', message: 'Failed to load time entries' })
    } finally {
      setLoading(false)
    }
  }

  async function loadClients() {
    try {
      const data = await getClients()
      setClients(data)
    } catch {
      setNotification({ type: 'error', message: 'Failed to load clients' })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)

    try {
      if (editingEntry) {
        const updateData: UpdateTimeEntryInput = {
          client_id: formData.client_id,
          date: formData.date,
          hours: formData.hours,
          description: formData.description
        }
        await updateTimeEntry(editingEntry.id, updateData)
        setNotification({ type: 'success', message: 'Time entry updated successfully' })
        setEditingEntry(null)
      } else {
        await createTimeEntry(formData, user.id)
        setNotification({ type: 'success', message: 'Time entry created successfully' })
      }
      
      // Reset form
      setFormData({
        client_id: '',
        date: new Date().toISOString().split('T')[0],
        hours: 0,
        description: ''
      })
      
      // Reload entries
      loadTimeEntries()
    } catch {
      setNotification({ type: 'error', message: 'Failed to save time entry' })
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this entry?')) return

    try {
      await deleteTimeEntry(id)
      setNotification({ type: 'success', message: 'Time entry deleted successfully' })
      loadTimeEntries()
    } catch {
      setNotification({ type: 'error', message: 'Failed to delete time entry' })
    }
  }

  function handleEdit(entry: TimeEntry) {
    setEditingEntry(entry)
    setFormData({
      client_id: entry.client_id,
      date: entry.date,
      hours: entry.hours,
      description: entry.description
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingEntry(null)
    setFormData({
      client_id: '',
      date: new Date().toISOString().split('T')[0],
      hours: 0,
      description: ''
    })
  }

  return (
    <div className="w-full py-8 px-8">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Time Tracker</h1>
          <p className="text-gray-600 mt-2">Track your work hours and manage your time</p>
        </header>

        {/* Time Entry Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">
            {editingEntry ? 'Edit Time Entry' : 'Add New Time Entry'}
          </h2>
          
          {clients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You need to add a client before tracking time.</p>
              <Link
                href="/clients"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Your First Client
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="client" className="block text-sm font-medium text-gray-700">
                    Client
                  </label>
                  <select
                    id="client"
                    required
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="hours" className="block text-sm font-medium text-gray-700">
                    Hours
                  </label>
                  <input
                    type="number"
                    id="hours"
                    required
                    min="0.1"
                    step="0.1"
                    value={formData.hours || ''}
                    onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : editingEntry ? 'Update Entry' : 'Add Entry'}
                </button>
                {editingEntry && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Time Entries List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Time Entries</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading time entries...</p>
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No time entries yet. Add your first entry above!</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.client?.name || 'Unknown Client'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {entry.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.hours}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.client && (
                            <>
                              {entry.client.currency} {(entry.hours * entry.client.hourly_rate).toFixed(2)}
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}