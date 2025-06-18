'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DatePicker from 'react-datepicker'
import { TimeEntry, CreateTimeEntryInput } from '@/types/database'
import { Notification } from '@/components/Notification'
import { useAuth } from '@/contexts/AuthContext'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { useClients } from '@/hooks/useClients'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'

export default function Home() {
  const { user } = useAuth()
  const { timeEntries, loading, page, totalPages, loadTimeEntries, createEntry, updateEntry, deleteEntry, goToPage } = useTimeEntries()
  const { clients, loadClients } = useClients()
  const [formLoading, setFormLoading] = useState(false)
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  useEffect(() => {
    loadClients()
    loadTimeEntries()
  }, [loadClients, loadTimeEntries])

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    
    // Validate required fields
    if (!formData.description || !formData.client_id || !formData.hours) {
      setNotification({ type: 'error', message: 'Please fill in all fields' })
      return
    }
    
    setFormLoading(true)

    try {
      let result
      if (editingEntry) {
        const updateData = {
          client_id: formData.client_id,
          date: formData.date,
          hours: formData.hours,
          description: formData.description
        }
        result = await updateEntry(editingEntry.id, updateData)
        if (result.success) {
          setNotification({ type: 'success', message: 'Time entry updated successfully' })
          setEditingEntry(null)
        } else {
          setNotification({ type: 'error', message: result.error || 'Failed to update time entry' })
        }
      } else {
        result = await createEntry(formData, user.id)
        if (result.success) {
          setNotification({ type: 'success', message: 'Time entry created successfully' })
        } else {
          setNotification({ type: 'error', message: result.error || 'Failed to create time entry' })
        }
      }
      
      if (result.success) {
        // Reset form
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        setFormData({
          client_id: '',
          date: todayStr,
          hours: 0,
          description: ''
        })
        setSelectedDate(today)
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to save time entry' })
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this entry?')) return

    const result = await deleteEntry(id)
    if (result.success) {
      setNotification({ type: 'success', message: 'Time entry deleted successfully' })
    } else {
      setNotification({ type: 'error', message: result.error || 'Failed to delete time entry' })
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
    setSelectedDate(dateObj)
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
    setSelectedDate(today)
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
              <Link href="/clients">
                <Button variant="primary">
                  Add Your First Client
                </Button>
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
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => {
                      if (date) {
                        setSelectedDate(date)
                        const dateStr = date.toISOString().split('T')[0]
                        setFormData({ ...formData, date: dateStr })
                      }
                    }}
                    dateFormat="dd MMM yy"
                    className="w-28 text-sm focus:outline-none cursor-pointer bg-transparent border-0 p-0 text-center"
                    placeholderText="Date"
                    popperClassName="react-datepicker-popper"
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
              <Button
                type="button"
                onClick={cancelEdit}
                variant="secondary"
              >
                Cancel Edit
              </Button>
            </div>
          )}
        </div>

        {/* Time Entries List */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Time Entries</h2>
          </CardHeader>

          {loading ? (
            <CardContent className="text-center">
              <p className="text-gray-500">Loading time entries...</p>
            </CardContent>
          ) : timeEntries.length === 0 ? (
            <CardContent className="text-center">
              <p className="text-gray-500">No time entries yet. Add your first entry above!</p>
            </CardContent>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {entry.client?.name || 'Unknown Client'}
                      </TableCell>
                      <TableCell>
                        {entry.description}
                      </TableCell>
                      <TableCell>
                        {entry.hours}
                      </TableCell>
                      <TableCell>
                        {entry.client && (
                          <>
                            {entry.client.currency} {(entry.hours * entry.client.hourly_rate).toFixed(2)}
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleEdit(entry)}
                          variant="ghost"
                          size="sm"
                          className="mr-2"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(entry.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <Button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    variant="secondary"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                    variant="secondary"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}