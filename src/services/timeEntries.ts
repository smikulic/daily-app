import { createClient } from '@/lib/supabase/client'
import { TimeEntry, CreateTimeEntryInput, UpdateTimeEntryInput } from '@/types/database'

export async function getTimeEntries(page = 1, limit = 10) {
  const supabase = createClient()
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('time_entries')
    .select(`
      *,
      client:clients(*)
    `, { count: 'exact' })
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return {
    data: data as TimeEntry[],
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export async function createTimeEntry(input: CreateTimeEntryInput, userId: string) {
  const supabase = createClient()
  
  // Add user_id to the input
  const timeEntryData = {
    ...input,
    user_id: userId
  }
  
  const { data, error } = await supabase
    .from('time_entries')
    .insert(timeEntryData)
    .select(`
      *,
      client:clients(*)
    `)
    .single()

  if (error) throw error
  return data as TimeEntry
}

export async function updateTimeEntry(id: string, input: UpdateTimeEntryInput) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('time_entries')
    .update(input)
    .eq('id', id)
    .select(`
      *,
      client:clients(*)
    `)
    .single()

  if (error) throw error
  return data as TimeEntry
}

export async function deleteTimeEntry(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id)

  if (error) throw error
}