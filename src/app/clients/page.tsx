'use client'

import { useState, useEffect } from 'react'
import { Client, CreateClientInput, UpdateClientInput } from '@/types/database'
import { Notification } from '@/components/Notification'
import { useAuth } from '@/contexts/AuthContext'
import { useClients } from '@/hooks/useClients'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'

export default function ClientsPage() {
  const { user } = useAuth()
  const { clients, loading, loadClients, createClient, updateClient, deleteClient } = useClients()
  const [formLoading, setFormLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<CreateClientInput>({
    name: '',
    hourly_rate: 0,
    currency: 'USD',
    email: '',
    address: ''
  })

  useEffect(() => {
    loadClients()
  }, [loadClients])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)

    try {
      let result
      if (editingClient) {
        const updateData: UpdateClientInput = {
          name: formData.name,
          hourly_rate: formData.hourly_rate,
          currency: formData.currency,
          ...(formData.email && { email: formData.email }),
          ...(formData.address && { address: formData.address })
        }
        result = await updateClient(editingClient.id, updateData)
        if (result.success) {
          setNotification({ type: 'success', message: 'Client updated successfully' })
          setEditingClient(null)
        } else {
          setNotification({ type: 'error', message: result.error || 'Failed to update client' })
        }
      } else {
        result = await createClient(formData, user.id)
        if (result.success) {
          setNotification({ type: 'success', message: 'Client created successfully' })
        } else {
          setNotification({ type: 'error', message: result.error || 'Failed to create client' })
        }
      }
      
      if (result.success) {
        // Reset form
        setFormData({
          name: '',
          hourly_rate: 0,
          currency: 'USD',
          email: '',
          address: ''
        })
        setShowForm(false)
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to save client' })
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to deactivate "${name}"?`)) return

    const result = await deleteClient(id)
    if (result.success) {
      setNotification({ type: 'success', message: 'Client deactivated successfully' })
    } else {
      setNotification({ type: 'error', message: result.error || 'Failed to delete client' })
    }
  }

  function handleEdit(client: Client) {
    setEditingClient(client)
    setFormData({
      name: client.name,
      hourly_rate: client.hourly_rate,
      currency: client.currency,
      email: client.email || '',
      address: client.address || ''
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingClient(null)
    setFormData({
      name: '',
      hourly_rate: 0,
      currency: 'USD',
      email: '',
      address: ''
    })
    setShowForm(false)
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
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="mt-2 text-gray-600">Manage your clients and their hourly rates</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="primary"
          >
            {showForm ? 'Cancel' : 'Add Client'}
          </Button>
        </header>

        {/* Client Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name" required>Client Name</Label>
                    <Input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hourly_rate" required>Hourly Rate</Label>
                    <Input
                      type="number"
                      id="hourly_rate"
                      required
                      min="0"
                      step="1"
                      value={formData.hourly_rate || ''}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: parseInt(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency" required>Currency</Label>
                    <Select
                      id="currency"
                      required
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="mt-1"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="AUD">AUD (A$)</option>
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <textarea
                      id="address"
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    loading={formLoading}
                    variant="primary"
                  >
                    {editingClient ? 'Update Client' : 'Add Client'}
                  </Button>
                  <Button
                    type="button"
                    onClick={cancelEdit}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Clients List */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Your Clients</h2>
          </CardHeader>

          {loading ? (
            <CardContent className="text-center">
              <p className="text-gray-500">Loading clients...</p>
            </CardContent>
          ) : clients.length === 0 ? (
            <CardContent className="text-center">
              <p className="text-gray-500 mb-4">No clients yet. Add your first client to get started!</p>
              <Button
                onClick={() => setShowForm(true)}
                variant="primary"
              >
                Add Your First Client
              </Button>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className={client.is_active ? '' : 'opacity-50'}>
                    <TableCell>
                      <div className="font-medium">{client.name}</div>
                      {client.address && (
                        <div className="text-sm text-gray-500">{client.address}</div>
                      )}
                    </TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>{client.currency} {client.hourly_rate}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        client.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleEdit(client)}
                        variant="ghost"
                        size="sm"
                        className="mr-2"
                      >
                        Edit
                      </Button>
                      {client.is_active && (
                        <Button
                          onClick={() => handleDelete(client.id, client.name)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-900"
                        >
                          Deactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}