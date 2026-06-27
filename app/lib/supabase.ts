import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getTrips() {
  const { data, error } = await supabase
    .from('trips')
    .select('*, itinerary_items(count)')
    .order('start_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createTrip(trip: {
  title: string
  destination?: string
  start_date: string
  end_date: string
  cover_emoji?: string
  currency?: string
}) {
  const { data, error } = await supabase
    .from('trips')
    .insert(trip)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getItemsByTrip(tripId: string) {
  const { data, error } = await supabase
    .from('itinerary_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('date')
    .order('sort_order')
  if (error) throw error
  return data
}

export async function createItem(item: {
  trip_id: string
  date: string
  title: string
  location?: string
  start_time?: string
  note?: string
  category?: string
  sort_order?: number
}) {
  const { data, error } = await supabase
    .from('itinerary_items')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTrip(id: string) {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteItem(id: string) {
  const { error } = await supabase
    .from('itinerary_items')
    .delete()
    .eq('id', id)
  if (error) throw error
}
