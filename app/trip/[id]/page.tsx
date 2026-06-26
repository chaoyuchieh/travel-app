"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "../../lib/supabase"
import TripDetail from "../../components/TripDetail"

export default function SharedTripPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase
      .from('trips')
      .select('*')
      .eq('share_token', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setTrip(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div style={{ textAlign: "center", padding: "3rem", color: "#888" }}>載入中...</div>
  if (notFound) return (
    <div style={{ textAlign: "center", padding: "3rem" }}>
      <p style={{ fontSize: 48 }}>🔍</p>
      <p style={{ fontSize: 16, fontWeight: 500 }}>找不到這個旅行</p>
      <p style={{ fontSize: 13, color: "#888" }}>連結可能已失效</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem", minHeight: "100vh", background: "#f5f5f3" }}>
      <div style={{ background: "#E6F1FB", borderRadius: 10, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: "#185FA5" }}>
        👥 共同編輯模式
      </div>
      <TripDetail trip={{ ...trip, days_count: 0, items_count: 0 }} onBack={() => window.history.back()} />
    </div>
  )
}