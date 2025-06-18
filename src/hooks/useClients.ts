import { useState, useCallback } from 'react'
import { getAllClientRecords, createClientRecord, updateClient, deleteClient } from '@/services/clients'
import { Client, CreateClientInput, UpdateClientInput } from '@/types/database'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadClients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllClientRecords()
      setClients(data)
    } catch (err) {
      setError('Failed to load clients')
      console.error('Error loading clients:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createClient = useCallback(async (data: CreateClientInput, userId: string) => {
    try {
      await createClientRecord(data, userId)
      await loadClients() // Refresh the list
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = 'Failed to create client'
      console.error('Error creating client:', err)
      return { success: false, error: errorMessage }
    }
  }, [loadClients])

  const updateClientById = useCallback(async (id: string, data: UpdateClientInput) => {
    try {
      await updateClient(id, data)
      await loadClients() // Refresh the list
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = 'Failed to update client'
      console.error('Error updating client:', err)
      return { success: false, error: errorMessage }
    }
  }, [loadClients])

  const deleteClientById = useCallback(async (id: string) => {
    try {
      await deleteClient(id)
      await loadClients() // Refresh the list
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = 'Failed to delete client'
      console.error('Error deleting client:', err)
      return { success: false, error: errorMessage }
    }
  }, [loadClients])

  return {
    clients,
    loading,
    error,
    loadClients,
    createClient,
    updateClient: updateClientById,
    deleteClient: deleteClientById,
  }
}