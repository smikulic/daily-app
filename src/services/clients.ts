import { createClient } from '@/lib/supabase/client'
import { Client, CreateClientInput, UpdateClientInput } from '@/types/database'

export async function getClients() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  if (error) throw error
  return data as Client[]
}

export async function getAllClientRecords() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  if (error) throw error
  return data as Client[]
}

export async function createClientRecord(input: CreateClientInput, userId: string) {
  const supabase = createClient()
  
  // Add user_id to the input
  const clientData = {
    ...input,
    user_id: userId
  }
  
  const { data, error } = await supabase
    .from('clients')
    .insert(clientData)
    .select()
    .single()

  if (error) throw error
  return data as Client
}

export async function updateClient(id: string, input: UpdateClientInput) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('clients')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Client
}

export async function deleteClient(id: string) {
  const supabase = createClient()
  
  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('clients')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}