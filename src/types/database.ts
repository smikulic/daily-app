export interface Client {
  id: string
  user_id: string
  name: string
  hourly_rate: number
  currency: string
  email: string | null
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimeEntry {
  id: string
  user_id: string
  client_id: string
  date: string
  hours: number
  description: string
  created_at: string
  updated_at: string
  // Joined data
  client?: Client
}

export interface CreateTimeEntryInput {
  client_id: string
  date: string
  hours: number
  description: string
}

export interface UpdateTimeEntryInput {
  client_id?: string
  date?: string
  hours?: number
  description?: string
}

export interface CreateClientInput {
  name: string
  hourly_rate: number
  currency: string
  email?: string
  address?: string
}

export interface UpdateClientInput {
  name?: string
  hourly_rate?: number
  currency?: string
  email?: string
  address?: string
  is_active?: boolean
}