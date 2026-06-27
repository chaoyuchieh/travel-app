"use client"
import { useState, useEffect } from "react"
import { getTrips, createTrip } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import TripDetail from './TripDetail'

interface Trip {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  cover_emoji: string
  currency: string
  days_count: number
  items_count: number
}

function dateDiff(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1
}

const EMOJIS = ["✈️","🌸","🌊","🏔️","🌴","🗼","🎡","🏖️","🌍","🎑","🍣","🏕️"]

const PAD: React.CSSProperties = { padding: "1.5rem 1rem" }

function TripCard({ trip, onClick, onEdit, onDelete, onShare }: {
  trip: Trip; onClick: () => void; onEdit: () => void; onDelete: () => void; onShare: () => void
}) {
  const today = new Date()
  const start = new Date(trip.start_date)
  const end = new Date(trip.end_date)
  const isPast = end < today
  const isActive = start <= today && today <= end
  const daysLeft = Math.ceil((start.getTime() - today.getTime()) / 86400000)

  return (
    <div onClick={onClick} style={{ background: "white", border: "1px solid #eee", borderRadius: 16, padding: "1.25rem", cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, fontSize: 24, background: "#f5f5f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {trip.cover_emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <p style={{ margin: 0, fontWeight: 500, fontSize: 16 }}>{trip.title}</p>
            {isActive && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#E1F5EE", color: "#085041" }}>進行中</span>}
            {isPast && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#f0f0f0", color: "#888" }}>已結束</span>}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#888" }}>📍 {trip.destination}</p>
        </div>
        <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
          <button onClick={onShare} style={{ background: "#E1F5EE", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 13, cursor: "pointer" }}>🔗</button>
          <button onClick={onEdit} style={{ background: "#f0f0f0", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 13, cursor: "pointer" }}>✏️</button>
          <button onClick={onDelete} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 13, cursor: "pointer" }}>🗑️</button>
        </div>
      </div>
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f0f0", display: "flex", gap: 16 }}>
        {[
          { label: "出發", value: `${new Date(trip.start_date).getMonth()+1}/${new Date(trip.start_date).getDate()}` },
          { label: "天數", value: `${dateDiff(trip.start_date, trip.end_date)} 天` },
        ].map(m => (
          <div key={m.label}>
            <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{m.label}</p>
            <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 500 }}>{m.value}</p>
          </div>
        ))}
        {!isPast && !isActive && daysLeft > 0 && (
          <div style={{ marginLeft: "auto" }}>
            <p style={{ margin: 0, fontSize: 11, color: "#888" }}>倒數</p>
            <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 500, color: "#185FA5" }}>{daysLeft} 天</p>
          </div>
        )}
      </div>
    </div>
  )
}

function EditTripModal({ trip, onClose, onUpdated }: { trip: Trip; onClose: () => void; onUpdated: (t: Trip) => void }) {
  const [form, setForm] = useState({ title: trip.title, destination: trip.destination, start_date: trip.start_date, end_date: trip.end_date, cover_emoji: trip.cover_emoji, currency: trip.currency })
  const [loading, setLoading] = useState(false)
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.title.trim() && form.destination.trim() && form.start_date && form.end_date && form.end_date >= form.start_date
  const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box" }

  async function handleSave() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('trips').update(form).eq('id', trip.id).select().single()
      if (error) throw error
      onUpdated({ ...data, days_count: dateDiff(data.start_date, data.end_date), items_count: trip.items_count })
    } catch (e) {
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 440, padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>編輯旅行</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>旅行名稱</label>
            <input style={inp} value={form.title} onChange={e => update("title", e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>目的地</label>
            <input style={inp} value={form.destination} onChange={e => update("destination", e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>出發日期</label>
              <input type="date" style={inp} value={form.start_date} onChange={e => update("start_date", e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>返回日期</label>
              <input type="date" style={inp} value={form.end_date} min={form.start_date} onChange={e => update("end_date", e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 8 }}>封面圖示</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => update("cover_emoji", e)} style={{ width: 40, height: 40, fontSize: 20, border: "none", borderRadius: 10, cursor: "pointer", background: form.cover_emoji === e ? "#E6F1FB" : "#f5f5f5", outline: form.cover_emoji === e ? "2px solid #378ADD" : "none" }}>{e}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>貨幣</label>
            <select style={inp} value={form.currency} onChange={e => update("currency", e.target.value)}>
              {["TWD","JPY","USD","EUR","THB","IDR","KRW"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: "1.5rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", fontSize: 14, cursor: "pointer", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 10 }}>取消</button>
          <button onClick={handleSave} disabled={!valid || loading} style={{ flex: 2, padding: "10px", fontSize: 14, fontWeight: 500, cursor: "pointer", background: valid && !loading ? "#185FA5" : "#ddd", color: valid && !loading ? "white" : "#999", border: "none", borderRadius: 10 }}>
            {loading ? "儲存中…" : "儲存變更"}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateTripModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: Trip) => void }) {
  const [form, setForm] = useState({ title: "", destination: "", start_date: "", end_date: "", cover_emoji: "✈️", currency: "TWD" })
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const valid1 = form.title.trim() && form.destination.trim()
  const valid2 = form.start_date && form.end_date && form.end_date >= form.start_date
  const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box" }

  async function handleSubmit() {
    setLoading(true)
    try {
      const data = await createTrip(form)
      onCreated({ ...data, days_count: dateDiff(data.start_date, data.end_date), items_count: 0 })
    } catch (e) {
      alert('建立失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 440, padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: "#888" }}>步驟 {step} / 2</p>
            <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 500 }}>{step === 1 ? "旅行基本資訊" : "選擇日期"}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem" }}>
          {[1,2].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: s <= step ? "#378ADD" : "#eee" }} />)}
        </div>
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>旅行名稱</label>
              <input style={inp} placeholder="例：東京春日行" value={form.title} onChange={e => update("title", e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>目的地</label>
              <input style={inp} placeholder="例：日本・東京" value={form.destination} onChange={e => update("destination", e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 8 }}>封面圖示</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => update("cover_emoji", e)} style={{ width: 40, height: 40, fontSize: 20, border: "none", borderRadius: 10, cursor: "pointer", background: form.cover_emoji === e ? "#E6F1FB" : "#f5f5f5", outline: form.cover_emoji === e ? "2px solid #378ADD" : "none" }}>{e}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>出發日期</label>
                <input type="date" style={inp} value={form.start_date} onChange={e => update("start_date", e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>返回日期</label>
                <input type="date" style={inp} value={form.end_date} min={form.start_date} onChange={e => update("end_date", e.target.value)} />
              </div>
            </div>
            {form.start_date && form.end_date && form.end_date >= form.start_date && (
              <div style={{ background: "#E6F1FB", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{form.cover_emoji}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#0C447C" }}>{form.title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#185FA5" }}>{dateDiff(form.start_date, form.end_date)} 天・{form.destination}</p>
                </div>
              </div>
            )}
            <div>
              <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>主要貨幣</label>
              <select style={inp} value={form.currency} onChange={e => update("currency", e.target.value)}>
                {["TWD","JPY","USD","EUR","THB","IDR","KRW"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: "1.5rem" }}>
          {step === 2 && <button onClick={() => setStep(1)} style={{ flex: 1, padding: "10px", fontSize: 14, cursor: "pointer", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 10 }}>← 上一步</button>}
          <button onClick={() => step === 1 ? (valid1 && setStep(2)) : handleSubmit()} disabled={step === 1 ? !valid1 : !valid2 || loading}
            style={{ flex: 2, padding: "10px", fontSize: 14, fontWeight: 500, cursor: "pointer", background: (step === 1 ? valid1 : valid2) && !loading ? "#185FA5" : "#ddd", color: (step === 1 ? valid1 : valid2) && !loading ? "white" : "#999", border: "none", borderRadius: 10 }}>
            {loading ? "建立中…" : step === 1 ? "下一步 →" : "建立旅行 ✓"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TravelApp() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTrips()
      .then(data => setTrips((data || []).map((t: any) => ({ ...t, days_count: dateDiff(t.start_date, t.end_date), items_count: 0 }))))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function deleteTrip(id: string) {
    if (!confirm('確定要刪除這趟旅行嗎？所有行程也會一併刪除。')) return
    try {
      const { error } = await supabase.from('trips').delete().eq('id', id)
      if (error) throw error
      setTrips(prev => prev.filter(t => t.id !== id))
    } catch (e) {
      alert('刪除失敗')
    }
  }

  async function shareTrip(id: string) {
    try {
      const { data } = await supabase.from('trips').select('share_token').eq('id', id).single()
      if (!data || !data.share_token) {
        alert('無法取得分享連結')
        return
      }
      const url = `${window.location.origin}/trip/${data.share_token}`
      navigator.clipboard.writeText(url)
      alert('分享連結已複製！\n\n' + url)
    } catch (e) {
      alert('複製失敗')
    }
  }

  return (
  <div className="app-container">
    {editingTrip && (
      <EditTripModal
        trip={editingTrip}
        onClose={() => setEditingTrip(null)}
        onUpdated={updated => {
          setTrips(prev => prev.map(t => t.id === updated.id ? updated : t))
          setEditingTrip(null)
        }}
      />
    )}
      {activeTrip ? (
  <TripDetail trip={activeTrip} onBack={() => setActiveTrip(null)} />
) : (
  <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>我的旅行</h1>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>{trips.length} 趟旅程</p>
            </div>
            <button onClick={() => setShowCreate(true)} style={{ background: "#185FA5", color: "white", border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>+ 新增旅行</button>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#888" }}>載入中...</div>
          ) : trips.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#888" }}>
              <p style={{ fontSize: 48, margin: "0 0 12px" }}>✈️</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "#333" }}>還沒有旅行計畫</p>
              <p style={{ margin: "6px 0 0", fontSize: 13 }}>點「+ 新增旅行」開始規劃你的第一趟旅程</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {trips.map(t => (
                <TripCard
                  key={t.id}
                  trip={t}
                  onClick={() => setActiveTrip(t)}
                  onEdit={() => setEditingTrip(t)}
                  onDelete={() => deleteTrip(t.id)}
                  onShare={() => shareTrip(t.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {showCreate && (
        <CreateTripModal onClose={() => setShowCreate(false)} onCreated={t => { setTrips(prev => [t, ...prev]); setShowCreate(false); setActiveTrip(t) }} />
      )}
    </div>
  )
}
