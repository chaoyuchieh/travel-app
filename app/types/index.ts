export type Category = 'attraction' | 'food' | 'hotel' | 'transport' | 'other'
export type ExpenseCategory = 'food' | 'transport' | 'hotel' | 'activity' | 'shopping' | 'other'

export interface Trip {
  id: string
  user_id: string
  title: string
  destination?: string
  start_date: string
  end_date: string
  cover_emoji: string
  currency: string
  created_at: string
  days_count?: number
  items_count?: number
}

export interface ItineraryItem {
  id: string
  trip_id: string
  date: string
  sort_order: number
  title: string
  location?: string
  place_id?: string
  start_time?: string
  end_time?: string
  note?: string
  category: Category
  est_cost?: number
  created_at: string
}

export interface Expense {
  id: string
  trip_id: string
  date: string
  title: string
  amount: number
  currency: string
  paid_by: string
  category: ExpenseCategory
  splits: Split[]
  created_at: string
}

export interface Split {
  name: string
  amount: number
  settled: boolean
}

export interface ShoppingItem {
  id: string
  trip_id: string
  name: string
  store?: string
  budget?: number
  purchased: boolean
  expense_id?: string
  created_at: string
}

export interface TripMember {
  id: string
  trip_id: string
  name: string
  color: string
}

export type NewTrip = Omit<Trip, 'id' | 'user_id' | 'created_at' | 'days_count' | 'items_count'>
export type NewItem = Omit<ItineraryItem, 'id' | 'created_at'>