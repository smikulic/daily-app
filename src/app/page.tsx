'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Datepicker, { DateValueType } from 'react-tailwindcss-datepicker'
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
  
  // Datepicker state
  const [dateValue, setDateValue] = useState<DateValueType>({
    startDate: new Date(),
    endDate: new Date()
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

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    
    // Validate required fields
    if (!formData.description || !formData.client_id || !formData.hours) {
      setNotification({ type: 'error', message: 'Please fill in all fields' })
      return
    }
    
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
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      setFormData({
        client_id: '',
        date: todayStr,
        hours: 0,
        description: ''
      })
      setDateValue({
        startDate: today,
        endDate: today
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
    // Convert string date to Date object for datepicker
    const dateObj = new Date(entry.date)
    setDateValue({
      startDate: dateObj,
      endDate: dateObj
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingEntry(null)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    setFormData({
      client_id: '',
      date: todayStr,
      hours: 0,
      description: ''
    })
    setDateValue({
      startDate: today,
      endDate: today
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
        {/* Time Entry Form */}
        <div className="mb-8">
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
            <div className="relative my-8 h-16 w-12/12 border border-violet-300 rounded-xl">
              <input
                type="text"
                name="description"
                id="description"
                placeholder="What are you working on?"
                className="block w-full h-full pl-4 pr-20 rounded-2xl text-l text-gray-700 placeholder:text-gray-400 focus:outline-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <div className="h-full flex items-center px-2 border-l border-violet-300">
                  <select
                    id="client"
                    name="client"
                    className="h-full w-28 bg-transparent text-sm text-gray-700 truncate focus:outline-none"
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    required
                  >
                    <option value="">Client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="h-full flex items-center px-2 relative">
                  <Datepicker
                    asSingle
                    useRange={false}
                    value={dateValue}
                    onChange={(value: DateValueType) => {
                      if (value) {
                        setDateValue(value)
                        if (value.startDate) {
                          // Convert Date to string format YYYY-MM-DD
                          const dateObj = new Date(value.startDate)
                          const dateStr = dateObj.toISOString().split('T')[0]
                          setFormData({ ...formData, date: dateStr })
                        }
                      }
                    }}
                    placeholder="Date"
                    displayFormat="DD MMM YY"
                    inputClassName="w-28 text-sm focus:outline-none cursor-pointer"
                    toggleClassName="hidden"
                    containerClassName="relative"
                    popoverDirection="down"
                    readOnly={true}
                  />
                </div>
                <div className="h-full flex items-center px-2">
                  <input
                    type="text"
                    name="hours"
                    id="hours"
                    placeholder="0"
                    className="h-full w-6 bg-transparent text-center text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                    value={formData.hours || ''}
                    onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="h-full flex items-center pr-2 border-l-transparent border-r border-violet-300">
                  h
                </div>

                <div className="px-5 flex items-center h-full bg-violet-600 rounded-r-[0.7rem]">
                  <div
                    className="text-sm text-violet-100 bg-violet-600 cursor-pointer hover:text-violet-400"
                    onClick={handleSubmit}
                  >
                    {formLoading ? 'Saving...' : editingEntry ? 'Update' : 'Save'}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {editingEntry && (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel Edit
              </button>
            </div>
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